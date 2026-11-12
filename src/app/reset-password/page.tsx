"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setMsg("Use at least 8 characters.");
      setStatus("error");
      return;
    }
    setStatus("working");
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    if (error) {
      setMsg(/session/i.test(error.message) ? "That reset link expired. Request a new one from the sign-in page." : error.message);
      setStatus("error");
    } else window.location.assign("/dashboard");
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
        <h1>Set your password</h1>
        <p className="lead">Choose a password for your Channel. You&apos;ll use it with your email to sign in.</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>New password</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <button className="btn-primary" disabled={status === "working"} type="submit">
            {status === "working" ? "Saving…" : "Save password"}
          </button>
          {status === "error" && <p className="note">{msg}</p>}
          <p style={{ color: "var(--color-muted)", fontSize: 14, marginTop: 18 }}>
            <Link href="/login?mode=signin" style={{ color: "var(--color-brand2)" }}>Back to sign in</Link>
          </p>
        </form>
      </div>
    </>
  );
}
