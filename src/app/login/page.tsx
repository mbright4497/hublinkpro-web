"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) {
      setMsg(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  const failedLink =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("error");

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="logo">H</span>
          HubLink<span className="pro">Pro</span>
        </Link>
        <span />
        <span />
      </nav>
      <div className="page">
        <h1>Build your Channel</h1>
        <p className="lead">
          Enter your email and we&apos;ll send you a sign-in link. No password. This is how you
          create and manage your HubLinkPro Channel.
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
            {status === "error" && <p className="note">Couldn&apos;t send the link: {msg}</p>}
          </form>
        )}
      </div>
    </>
  );
}
