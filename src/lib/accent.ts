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
export const accentReadable = (hex: string) => isHex(hex) && contrast(hex, BG) >= 4.5;

function mix(hex: string, with_: number, amt: number) {
  return "#" + [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(v + (with_ - v) * amt).toString(16).padStart(2, "0");
  }).join("");
}

// CSS variables for the Channel page, or undefined when the default look applies.
export function accentStyle(hex: string | null | undefined, tier: string | null | undefined): CSSProperties | undefined {
  if (!hex || !isPaidTier(tier) || !accentReadable(hex)) return undefined;
  const light = mix(hex, 255, 0.25);
  return {
    "--color-brand": hex,
    "--color-brand2": light,
    "--on-brand": contrast(hex, "#1a1205") >= contrast(hex, "#ffffff") ? "#1a1205" : "#ffffff",
  } as CSSProperties;
}
