"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Mode = "build" | "signin" | "forgot";
const link = { color: "var(--color-brand2)" } as const;

export default function Login() {
  const [mode, setMode] = useState<Mode>("build");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "sent" | "confirm" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [failedLink, setFailedLink] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setMode(q.get("mode") === "signin" ? "signin" : "build");
    setFailedLink(q.has("error"));
  }, []);

  function go(m: Mode) {
    setMode(m);
    setStatus("idle");
    setMsg("");
  }

  function friendly(message: string) {
    if (/invalid login/i.test(message)) return "That email and password don't match. Try again, or use “Forgot password?”.";
    if (/already registered|already exists/i.test(message)) return "That email already has a Channel. Sign in instead.";
    if (/rate limit/i.test(message)) return "Too many attempts in a short time. Wait a few minutes and try again.";
    if (/password/i.test(message)) return message;
    return message;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("working");
    setMsg("");
    const sb = supabaseBrowser();

    if (mode === "forgot") {
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        setMsg(friendly(error.message));
        setStatus("error");
      } else setStatus("sent");
      return;
    }

    if (mode === "signin") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        setMsg(friendly(error.message));
        setStatus("error");
      } else window.location.assign("/dashboard");
      return;
    }

    // build
    if (password.length < 8) {
      setMsg("Use at least 8 characters for your password.");
      setStatus("error");
      return;
    }
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMsg(friendly(error.message));
      setStatus("error");
    } else if (data.session) {
      window.location.assign("/dashboard");
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      setMsg("That email already has a Channel. Sign in instead.");
      setStatus("error");
    } else {
      setStatus("confirm");
    }
  }

  const title = mode === "signin" ? "Sign in to your Channel" : mode === "forgot" ? "Reset your password" : "Build your Channel";
  const lead =
    mode === "signin"
      ? "Enter your email and password."
      : mode === "forgot"
        ? "Enter your email and we'll send you a link to set a new password."
        : "Pick a password and you're in. Create and manage your HubLinkPro Channel.";

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="logo">H</span>
          <span>HubLink<span className="pro">Pro</span></span>
        </Link>
        <span />
        <span />
      </nav>
      <div className="page">
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
        {failedLink && status === "idle" && (
          <p className="note">That link expired or was already used. Sign in below, or use “Forgot password?” for a new one.</p>
        )}
        {status === "sent" || status === "confirm" ? (
          <div className="autocard" style={{ borderColor: "var(--color-brand)" }}>
            <div className="ic">📬</div>
            <h3>Check your email</h3>
            <p>
              {status === "sent"
                ? `We sent a password reset link to ${email}.`
                : `We sent a confirmation link to ${email}. Open it to finish creating your Channel, then sign in.`}
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
              />
            </div>
            {mode !== "forgot" && (
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  required
                  minLength={mode === "build" ? 8 : undefined}
                  autoComplete={mode === "build" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "build" ? "At least 8 characters" : "Your password"}
                />
              </div>
            )}
            <button className="btn-primary" disabled={status === "working"} type="submit">
              {status === "working"
                ? "One moment…"
                : mode === "signin"
                  ? "Sign in"
                  : mode === "forgot"
                    ? "Send reset link"
                    : "Build my Channel, free"}
            </button>
            {status === "error" && <p className="note">{msg}</p>}
            <p style={{ color: "var(--color-muted)", fontSize: 14, marginTop: 18 }}>
              {mode === "signin" && (
                <>
                  <button type="button" onClick={() => go("forgot")} style={{ ...link, background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}>
                    Forgot password?
                  </button>
                  {" · "}New here?{" "}
                  <button type="button" onClick={() => go("build")} style={{ ...link, background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}>
                    Build your Channel
                  </button>
                </>
              )}
              {mode === "build" && (
                <>
                  Already have a Channel?{" "}
                  <button type="button" onClick={() => go("signin")} style={{ ...link, background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}>
                    Sign in
                  </button>
                </>
              )}
              {mode === "forgot" && (
                <button type="button" onClick={() => go("signin")} style={{ ...link, background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}>
                  Back to sign in
                </button>
              )}
            </p>
          </form>
        )}
      </div>
    </>
  );
}
