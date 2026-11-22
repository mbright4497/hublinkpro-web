"use client";
import { useRef, useState } from "react";

// "We texted you a code" step, shared by booking requests and SOS. Submits itself on the sixth digit.
export default function CodeEntry({ token, doneHref }: { token: string; doneHref: string }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const sent = useRef(false);

  async function submit(value: string) {
    if (sent.current) return;
    sent.current = true; setBusy(true); setErr(""); setNote("");
    try {
      const res = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, code: value }) });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Something went wrong."); setCode(""); setBusy(false); sent.current = false; return; }
      window.location.href = doneHref;
    } catch {
      setErr("Network problem. Try again."); setBusy(false); sent.current = false;
    }
  }

  async function resend() {
    setErr(""); setNote("");
    const res = await fetch("/api/verify/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const j = await res.json().catch(() => ({}));
    if (res.ok) setNote("Sent. Check your texts."); else setErr(j.error ?? "Couldn't send a new code.");
  }

  return (
    <div className="bookbox" aria-live="polite">
      <h2 style={{ marginTop: 0, fontSize: 20 }}>Enter the code we just texted you</h2>
      <p className="lead" style={{ fontSize: 14, marginTop: 0 }}>It takes a few seconds, and it keeps fake requests away from the pros.</p>
      {err && <p className="note" role="alert">{err}</p>}
      {note && <p className="note ok">{note}</p>}
      <div className="field">
        <label htmlFor="vc">6-digit code</label>
        <input id="vc" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} disabled={busy} autoFocus
          onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setCode(v); if (v.length === 6) submit(v); }}
          style={{ letterSpacing: "0.4em", fontSize: 22, textAlign: "center" }} />
      </div>
      <button type="button" className="btn-ghost" onClick={resend} disabled={busy}>Text me a new code</button>
    </div>
  );
}
