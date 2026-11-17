// Channel page background (paid tiers). Dark colors only, so the white text always stays readable.
import { isHex } from "@/lib/accent";

export const BG_PRESETS = [
  { name: "Midnight (default)", hex: "#061021" },
  { name: "Charcoal", hex: "#101114" },
  { name: "Slate", hex: "#10161f" },
  { name: "Ocean", hex: "#04182a" },
  { name: "Forest", hex: "#08170f" },
  { name: "Plum", hex: "#170a1f" },
  { name: "Wine", hex: "#1f0a10" },
  { name: "Espresso", hex: "#1a110b" },
];
export const DEFAULT_BG = "#061021";

function lum(hex: string) {
  const ch = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
// Contrast against white text of at least 12:1.
export const bgDarkEnough = (hex: string) => isHex(hex) && 1.05 / (lum(hex) + 0.05) >= 12;

function mix(hex: string, amt: number) {
  return "#" + [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(v + (255 - v) * amt).toString(16).padStart(2, "0");
  }).join("");
}

// CSS for the whole Channel page (nav and body included), or null for the default look.
export function bgCss(hex: string | null | undefined, paid: boolean): string | null {
  if (!hex || !paid || !bgDarkEnough(hex) || hex.toLowerCase() === DEFAULT_BG) return null;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `:root:root{--color-ink:${hex};--color-ink2:${mix(hex, 0.03)};--color-surface:${mix(hex, 0.03)};--color-card:${mix(hex, 0.06)};--color-line:${mix(hex, 0.14)}}body{background:${hex}}.nav{background:rgba(${r},${g},${b},.82)}`;
}
