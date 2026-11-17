// Channel accent color (paid tiers). One color the owner picks; the page derives the rest.
import type { CSSProperties } from "react";

export const ACCENT_PRESETS = [
  { name: "Ember", hex: "#d85a30" },
  { name: "Ocean", hex: "#2f80ed" },
  { name: "Emerald", hex: "#1fa971" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Rose", hex: "#e5527a" },
  { name: "Gold", hex: "#e0a21a" },
  { name: "Teal", hex: "#14b8c4" },
  { name: "Crimson", hex: "#d62839" },
];

export const isHex = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s);
export const isPaidTier = (tier: string | null | undefined) => tier === "pro" || tier === "favorite";

function lum(hex: string) {
  const ch = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const BG = "#061021"; // page background
// Readable as text/buttons on the dark page.
export const accentReadable = (hex: string, bg: string = BG) => isHex(hex) && contrast(hex, bg) >= 4.5;

function mix(hex: string, with_: number, amt: number) {
  return "#" + [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(v + (with_ - v) * amt).toString(16).padStart(2, "0");
  }).join("");
}

// CSS variables for the Channel page, or undefined when the default look applies.
export function accentStyle(hex_: string | null | undefined, tier: string | null | undefined, bg?: string | null): CSSProperties | undefined {
  if (!hex_ || !isPaidTier(tier)) return undefined;
  let hex: string = hex_;
  const page = bg && isHex(bg) ? bg : BG;
  // On a light page, darken the chosen color until it reads well; on the dark page an unreadable color is dropped.
  if (lum(page) > 0.4) {
    for (let a = 0; a <= 0.8 && !accentReadable(hex, page); a += 0.05) hex = mix(hex_, 0, a);
  }
  if (!accentReadable(hex, page)) return undefined;
  const onLight = !!bg && isHex(bg) && lum(bg) > 0.4;
  // On a light page the second color is a darker shade (readable as text); on dark it is lighter.
  const light = onLight ? mix(hex, 0, 0.2) : mix(hex, 255, 0.25);
  return {
    "--color-brand": hex,
    "--color-brand2": light,
    "--on-brand": contrast(hex, "#1a1205") >= contrast(hex, "#ffffff") ? "#1a1205" : "#ffffff",
  } as CSSProperties;
}
