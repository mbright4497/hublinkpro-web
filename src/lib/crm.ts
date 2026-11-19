// Shared helpers for the free CRM. Pure functions only, no database calls.
import { addDays, dayKey, fmtDayLabel } from "@/lib/booking";

export const STATUSES = [
  { key: "new", label: "New", color: "#60a5fa" },
  { key: "contacted", label: "Contacted", color: "#a78bfa" },
  { key: "quoted", label: "Quoted", color: "#fbbf24" },
  { key: "booked", label: "Booked", color: "#34d399" },
  { key: "won", label: "Won", color: "#22c55e" },
  { key: "lost", label: "Lost", color: "#64748b" },
] as const;

export type LeadStatus = (typeof STATUSES)[number]["key"];
export const OPEN_STATUSES: LeadStatus[] = ["new", "contacted", "quoted", "booked"];

export const SOURCES: Record<string, string> = {
  manual: "Added by you",
  booking: "Booked online",
  request: "Asked online",
  call: "Phone call",
};

export type Lead = {
  id: number;
  channel_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  service: string | null;
  source: string;
  status: LeadStatus;
  value_cents: number | null;
  follow_up_on: string | null;
  last_activity_at: string;
  created_at: string;
};

export type LeadEvent = { id: number; kind: string; body: string | null; created_at: string };

export const LEAD_COLUMNS =
  "id,channel_id,name,phone,email,service,source,status,value_cents,follow_up_on,last_activity_at,created_at";

export const isStatus = (v: unknown): v is LeadStatus => STATUSES.some((s) => s.key === v);
export const statusLabel = (k: string) => STATUSES.find((s) => s.key === k)?.label ?? k;
export const statusColor = (k: string) => STATUSES.find((s) => s.key === k)?.color ?? "#64748b";

/** The next step forward for a lead, or null once it is won or lost. */
export function nextStatus(s: LeadStatus): LeadStatus | null {
  const order: LeadStatus[] = ["new", "contacted", "quoted", "booked", "won"];
  const i = order.indexOf(s);
  return i === -1 || i === order.length - 1 ? null : order[i + 1];
}

export function phoneDigits(p: string | null | undefined): string {
  return (p ?? "").replace(/\D/g, "");
}

/** Same rule the database uses to decide two phone numbers are the same person. */
export function phoneKey(p: string | null | undefined): string | null {
  const d = phoneDigits(p).slice(-10);
  return d.length >= 7 ? d : null;
}

export function fmtPhone(p: string | null | undefined): string {
  if (!p) return "";
  let d = phoneDigits(p);
  if (d.length === 11 && d[0] === "1") d = d.slice(1);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

export const telHref = (p: string) => `tel:${p.replace(/[^0-9+]/g, "")}`;
export const smsHref = (p: string) => `sms:${p.replace(/[^0-9+]/g, "")}`;

/** Calls arrive with only a number; show it nicely instead of a raw +1423... string. */
export function leadTitle(l: Pick<Lead, "name" | "phone">): string {
  if (l.phone && (l.name === l.phone || l.name === "Unknown caller")) return fmtPhone(l.phone) || l.name;
  return l.name;
}

export function ago(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 14) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const dollars = (cents: number | null | undefined) =>
  cents == null ? "" : `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/** Parse "1,250.50" or "$300" into cents; null when empty or not a sane amount. */
export function parseDollars(v: FormDataEntryValue | null): number | null | "invalid" {
  const s = String(v ?? "").replace(/[$,\s]/g, "");
  if (!s) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return "invalid";
  const cents = Math.round(parseFloat(s) * 100);
  return cents > 100000000 ? "invalid" : cents;
}

export const todayIn = (tz: string) => dayKey(new Date(), tz);

function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
}

export type FollowTone = "late" | "today" | "later";

export function followUp(f: string | null, today: string): { text: string; tone: FollowTone } | null {
  if (!f) return null;
  const d = dayDiff(f, today);
  if (d < 0) return { text: d === -1 ? "Follow-up was yesterday" : `Follow-up ${-d} days late`, tone: "late" };
  if (d === 0) return { text: "Follow up today", tone: "today" };
  if (d === 1) return { text: "Follow up tomorrow", tone: "later" };
  const { dow, md } = fmtDayLabel(f);
  return { text: `Follow up ${dow}, ${md}`, tone: "later" };
}

export const isDue = (l: Lead, today: string) =>
  OPEN_STATUSES.includes(l.status) && !!l.follow_up_on && l.follow_up_on <= today;

export { addDays };

/** Spreadsheet programs run cells that start with = + - @ as formulas; neutralise them. */
export function csvCell(v: string | number | null | undefined): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
