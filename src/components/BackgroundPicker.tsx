"use client";
import { useState } from "react";
import { BG_PRESETS, DEFAULT_BG, bgAllowed } from "@/lib/background";
import { isHex } from "@/lib/accent";

export default function BackgroundPicker({ initial, paid, slug }: { initial: string | null; paid: boolean; slug?: string }) {
  const [hex, setHex] = useState(initial ?? "");
  const valid = isHex(hex);
  const ok = valid && bgAllowed(hex);
  const changed = (ok ? hex.toLowerCase() : "") !== (initial ?? "").toLowerCase();
  return (
    <div className="field">
      <label>Channel background {paid ? "" : "(Pro)"}</label>
      {!paid && <p className="hint">Pick the background of your Channel page, dark or white. Available on Pro. Free Channels use the HubLinkPro midnight blue.</p>}
      <input type="hidden" name="bg_color" value={paid && ok ? hex : ""} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", opacity: paid ? 1 : 0.5 }}>
        {BG_PRESETS.map((p) => {
          const sel = (hex || DEFAULT_BG).toLowerCase() === p.hex;
          return (
            <button key={p.hex} type="button" disabled={!paid} title={p.name} aria-label={p.name}
              onClick={() => setHex(p.hex === DEFAULT_BG ? "" : p.hex)}
              style={{ width: 34, height: 34, borderRadius: "50%", background: p.hex, cursor: paid ? "pointer" : "default",
                border: sel ? "3px solid #fff" : "2px solid rgba(255,255,255,.35)" }} />
          );
        })}
        <input type="text" disabled={!paid} value={hex} maxLength={7} placeholder="#061021" onChange={(e) => setHex(e.target.value.trim())}
          style={{ width: 110 }} aria-label="Custom background color, six-digit hex" />
        {hex && <button type="button" className="btn-ghost" disabled={!paid} onClick={() => setHex("")}>Reset</button>}
      </div>
      {paid && hex && !valid && <p className="hint" style={{ color: "#ff8a80" }}>Use a six-digit color like #10161f.</p>}
      {paid && valid && !ok && <p className="hint" style={{ color: "#ff8a80" }}>That color is too in-between. Pick a clearly dark or clearly light background so the text stays readable.</p>}
      {paid && changed && (hex === "" || ok) && (
        <p style={{ marginTop: 12 }}>
          <button type="submit" name="intent" value="save" className="btn-primary">
            {ok ? "Save background" : "Save (back to the default background)"}
          </button>
        </p>
      )}
      {paid && slug && <p className="hint">Saved? <a href={`/channel/${slug}`} style={{ textDecoration: "underline" }}>View your Channel</a> to see it live.</p>}
    </div>
  );
}
