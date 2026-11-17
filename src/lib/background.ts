// Channel page background (paid tiers). Dark or light colors only (no mid-tones), so the text always stays readable.
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
  { name: "White", hex: "#ffffff" },
  { name: "Cream", hex: "#faf6ee" },
  { name: "Mist", hex: "#eef2f7" },
];
const LIGHT_INK = "#0b1526"; // text color on light backgrounds
export const DEFAULT_BG = "#061021";

function lum(hex: string) {
  const ch = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const contrastW = (hex: string) => 1.05 / (lum(hex) + 0.05);
const contrastInk = (hex: string) => (lum(hex) + 0.05) / (lum(LIGHT_INK) + 0.05);
export const bgIsLight = (hex: string) => isHex(hex) && contrastInk(hex) >= 12;
export const bgDarkEnough = (hex: string) => isHex(hex) && contrastW(hex) >= 12;
// Allowed: clearly dark (white text) or clearly light (dark text).
export const bgAllowed = (hex: string) => bgDarkEnough(hex) || bgIsLight(hex);

function mix(hex: string, to: number, amt: number) {
  return "#" + [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16);
    return Math.round(v + (to - v) * amt).toString(16).padStart(2, "0");
  }).join("");
}

// CSS for the whole Channel page (nav and body included), or null for the default look.
export function bgCss(hex: string | null | undefined, paid: boolean): string | null {
  if (!hex || !paid || !bgAllowed(hex) || hex.toLowerCase() === DEFAULT_BG) return null;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  if (bgIsLight(hex)) {
    return `:root:root{--color-ink:${hex};--color-ink2:${mix(hex, 0, 0.035)};--color-surface:${mix(hex, 0, 0.035)};--color-card:${mix(hex, 255, 0.6)};--color-line:${mix(hex, 0, 0.13)};--color-mist:#44546b;--color-muted:#66758b;--color-light:#9a3412;--color-brand:#c2410c;--color-brand2:#b3380a;--on-brand:#ffffff}`
      + `body{background:${hex};color:${LIGHT_INK}}.nav{background:rgba(${r},${g},${b},.9)}`
      + `.navlinks a:hover{color:#000}.btn-ghost,button.btn-ghost{background:rgba(11,21,38,.06);color:${LIGHT_INK};border:1px solid rgba(11,21,38,.2)}`
      + `.field input,.field textarea,.field select,.page select,.actionbar .abtn,.lbclose,.lbnav button{color:${LIGHT_INK}}`
      + `.note{background:rgba(194,65,12,.08);border-color:rgba(194,65,12,.35);color:#9a3412}.note.ok{background:rgba(22,163,74,.1);border-color:rgba(22,163,74,.4);color:#166534}`;
  }
  return `:root:root{--color-ink:${hex};--color-ink2:${mix(hex, 255, 0.03)};--color-surface:${mix(hex, 255, 0.03)};--color-card:${mix(hex, 255, 0.06)};--color-line:${mix(hex, 255, 0.14)}}body{background:${hex}}.nav{background:rgba(${r},${g},${b},.82)}`;
}
