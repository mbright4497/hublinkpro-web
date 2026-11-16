"use client";
import { useState } from "react";
import { ACCENT_PRESETS, accentReadable, isHex } from "@/lib/accent";

export default function AccentPicker({ initial, paid }: { initial: string | null; paid: boolean }) {
  const [hex, setHex] = useState(initial ?? "");
  const valid = isHex(hex);
  const ok = valid && accentReadable(hex);
  return (
    <div className="field">
      <label>Channel accent color {paid ? "" : "(Pro)"}</label>
      {!paid && <p className="hint">Pick your own color for your buttons and highlights. Available on Pro. Free Channels use the HubLinkPro orange.</p>}
      <input type="hidden" name="accent_color" value={paid && ok ? hex : ""} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", opacity: paid ? 1 : 0.5 }}>
        {ACCENT_PRESETS.map((p) => (
          <button key={p.hex} type="button" disabled={!paid} title={p.name} aria-label={p.name} onClick={() => setHex(p.hex)}
            style={{ width: 34, height: 34, borderRadius: "50%", background: p.hex, cursor: paid ? "pointer" : "default",
              border: hex.toLowerCase() === p.hex ? "3px solid #fff" : "2px solid rgba(255,255,255,.25)" }} />
        ))}
        <input type="text" disabled={!paid} value={hex} maxLength={7} placeholder="#d85a30" onChange={(e) => setHex(e.target.value.trim())}
          style={{ width: 110 }} aria-label="Custom color, six-digit hex" />
        {hex && <button type="button" className="btn-ghost" disabled={!paid} onClick={() => setHex("")}>Reset</button>}
      </div>
      {paid && hex && !valid && <p className="hint" style={{ color: "#ff8a80" }}>Use a six-digit color like #2f80ed.</p>}
      {paid && valid && !ok && <p className="hint" style={{ color: "#ff8a80" }}>That color is too dark to read on the dark page. Try a lighter one.</p>}
      {paid && ok && (
        <p style={{ marginTop: 12 }}>
          <span style={{ display: "inline-block", background: hex, color: "#111", fontWeight: 800, padding: "10px 20px", borderRadius: 10 }}>Preview: Book a time</span>
        </p>
      )}
    </div>
  );
}
