"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [signin, setSignin] = useState(false);
  const [failedLink, setFailedLink] = useState(false);
  const [noAccount, setNoAccount] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setSignin(q.get("mode") === "signin");
    setFailedLink(q.has("error"));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setNoAccount(false);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // Sign in never creates an account; only the Build flow does.
        shouldCreateUser: !signin,
      },
    });
    if (error) {
      if (signin && /signups? not allowed|not found/i.test(error.message)) {
        setNoAccount(true);
        setMsg("");
      } else if (/rate limit/i.test(error.message)) {
        setMsg("Too many sign-in emails were sent in a short time. Wait a few minutes and try again.");
      } else {
        setMsg(error.message);
      }
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

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
        <h1>{signin ? "Sign in to your Channel" : "Build your Channel"}</h1>
        <p className="lead">
          {signin
            ? "Enter the email you used when you built your Channel and we'll send you a sign-in link. No password."
            : "Enter your email and we'll send you a link. No password. This is how you create and manage your HubLinkPro Channel."}
        </p>
        {failedLink && status === "idle" && (
          <p className="note">That link expired or was already used. Request a new one below.</p>
        )}
        {status === "sent" ? (
          <div className="autocard" style={{ borderColor: "var(--color-brand)" }}>
            <div className="ic">📬</div>
            <h3>Check your email</h3>
            <p>
              We sent a sign-in link to {email}. Open it on this same device and browser.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
              />
            </div>
            <button className="btn-primary" disabled={status === "sending"} type="submit">
              {status === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>
            {status === "error" && noAccount && (
              <p className="note">
                We don&apos;t have a Channel under that email. <Link href="/login" style={{ color: "var(--color-brand2)", textDecoration: "underline" }}>Build your Channel</Link> or try the email you used.
              </p>
            )}
            {status === "error" && !noAccount && <p className="note">Couldn&apos;t send the link: {msg}</p>}
            <p style={{ color: "var(--color-muted)", fontSize: 14, marginTop: 18 }}>
              {signin ? (
                <>New here? <Link href="/login" style={{ color: "var(--color-brand2)" }}>Build your Channel</Link></>
              ) : (
                <>Already have a Channel? <Link href="/login?mode=signin" style={{ color: "var(--color-brand2)" }}>Sign in</Link></>
              )}
            </p>
          </form>
        )}
      </div>
    </>
  );
}
