"use client";
import { useState } from "react";

// "I'm here now": reads the phone's location once, when the owner taps, and saves it for a few hours.
export default function TruckLiveCard({
  goLive, goOffline, liveUntil, note,
}: {
  goLive: (fd: FormData) => Promise<void>;
  goOffline: () => Promise<void>;
  liveUntil: string | null;
  note: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [hours, setHours] = useState("4");
  const [text, setText] = useState(note ?? "");
  const isLive = !!liveUntil && new Date(liveUntil).getTime() > Date.now();

  function here() {
    setErr("");
    if (!navigator.geolocation) return setErr("This device can't share its location.");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const fd = new FormData();
        fd.set("lat", String(pos.coords.latitude));
        fd.set("lng", String(pos.coords.longitude));
        fd.set("hours", hours);
        fd.set("note", text);
        void goLive(fd);
      },
      () => { setBusy(false); setErr("We couldn't get your location. Allow location access for this site and try again."); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div id="truck">
      <h2 className="dsec" style={{ borderTop: 0, paddingTop: 0 }}>Food truck: I&apos;m here now</h2>
      {isLive ? (
        <p className="hint">
          🟢 You&apos;re on the map until{" "}
          <strong>{new Date(liveUntil!).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</strong>. Then you
          disappear on your own.
        </p>
      ) : (
        <p className="hint">Off the map. Nobody sees where you are until you tap the button.</p>
      )}
      <div className="field">
        <label>Where / what&apos;s on today (optional)</label>
        <input value={text} maxLength={120} onChange={(e) => setText(e.target.value)} placeholder="Parked at the farmers market, tacos till sold out" />
      </div>
      <div className="field">
        <label>Stay on the map for</label>
        <select value={hours} onChange={(e) => setHours(e.target.value)}>
          {[2, 3, 4, 6, 8, 12].map((h) => <option key={h} value={h}>{h} hours</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" className="btn-primary" disabled={busy} onClick={here}>
          {busy ? "Finding you…" : isLive ? "📍 Update my spot" : "📍 I'm here now"}
        </button>
        {isLive && (
          <button type="button" className="btn-ghost" onClick={() => void goOffline()}>I&apos;m done for today</button>
        )}
      </div>
      {err && <p className="hint" style={{ color: "#ff8a80" }}>{err}</p>}
    </div>
  );
}
