"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SOS_CATEGORIES } from "@/lib/sos-categories";

export default function SosForm() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category, zip: f.get("zip"), name: f.get("name"), phone: f.get("phone"),
          problem: f.get("problem"), sms_consent: f.get("consent") === "on",
        }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? "Something went wrong."); setBusy(false); return; }
      router.push(`/sos/${j.token}`);
    } catch {
      setErr("Network problem. Try again, or call a pro directly."); setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bookbox">
      {err && <p className="note" role="alert">{err}</p>}
      <div className="field">
        <label>What&apos;s happening?</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8 }}>
          {SOS_CATEGORIES.map((c) => (
            <button type="button" key={c.slug} onClick={() => setCategory(c.slug)} aria-pressed={category === c.slug}
              className="btn-ghost" style={{ padding: "12px 10px", fontSize: 14, borderColor: category === c.slug ? "#ef4444" : undefined, background: category === c.slug ? "rgba(239,68,68,.18)" : undefined }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field"><label htmlFor="sos-zip">ZIP code</label>
        <input id="sos-zip" name="zip" required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} autoComplete="postal-code" /></div>
      <div className="field"><label htmlFor="sos-name">Your name</label>
        <input id="sos-name" name="name" required maxLength={80} autoComplete="name" /></div>
      <div className="field"><label htmlFor="sos-phone">Mobile phone</label>
        <input id="sos-phone" name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="(423) 555-0100" /></div>
      <div className="field"><label htmlFor="sos-problem">Anything the pro should know? (optional)</label>
        <textarea id="sos-problem" name="problem" rows={3} maxLength={500} /></div>
      <label style={{ display: "flex", gap: 10, fontSize: 13, margin: "0 0 16px", alignItems: "flex-start" }}>
        <input type="checkbox" name="consent" required style={{ marginTop: 3 }} />
        <span>I agree to receive text messages from HubLinkPro about this request. Msg &amp; data rates may apply. Reply STOP to opt out.</span>
      </label>
      <button className="btn-primary" type="submit" disabled={busy || !category} style={{ background: "#dc2626", color: "#fff", width: "100%", justifyContent: "center" }}>
        {busy ? "Finding the nearest pro…" : "Get a pro now"}
      </button>
      <p style={{ fontSize: 12, opacity: 0.75, marginTop: 12 }}>Life-threatening emergency, gas smell, fire, or live wires? Call 911 first.</p>
    </form>
  );
}
