// Daily assistant briefing for a Channel owner: what came in, what is waiting on them, what is due.
// Plain database facts, no AI call, so it costs nothing to run. Server-only.
import { SITE_URL } from "@/lib/site";
import { fmtTime } from "@/lib/booking";
import type { EmailParts } from "@/lib/email-template";

export type BriefLead = { id: number; name: string; service: string | null; source: string; status: string; created_at: string; owner_first_touch_at: string | null; follow_up_on: string | null };
export type BriefBooking = { name: string; service: string | null; starts_at: string };
export type BriefInput = { channelName: string; tz: string; leads: BriefLead[]; bookings: BriefBooking[]; nowMs: number; todayEt: string };

const OPEN = (s: string) => s !== "won" && s !== "lost";
const label = (l: BriefLead) => `${l.name}${l.service ? ` (${l.service})` : ""}`;

export function buildBriefing(i: BriefInput): { empty: boolean; subject: string; parts: EmailParts } {
  const day = 24 * 3600 * 1000;
  const open = i.leads.filter((l) => OPEN(l.status));
  const waiting = open.filter((l) => l.status === "new" && !l.owner_first_touch_at && i.nowMs - Date.parse(l.created_at) > 2 * 3600 * 1000);
  const waitingIds = new Set(waiting.map((l) => l.id));
  const fresh = open.filter((l) => i.nowMs - Date.parse(l.created_at) <= day && !waitingIds.has(l.id));
  const due = open.filter((l) => l.follow_up_on && l.follow_up_on <= i.todayEt && !waitingIds.has(l.id));

  const lines: string[] = [];
  for (const l of waiting) lines.push(`Waiting on you: ${label(l)}, no reply yet`);
  for (const b of i.bookings) lines.push(`Booked today at ${fmtTime(b.starts_at, i.tz)}: ${b.name}${b.service ? ` (${b.service})` : ""}`);
  for (const l of due) lines.push(`Follow up today: ${label(l)}`);
  for (const l of fresh) lines.push(`New in the last day: ${label(l)}, from a ${l.source}`);

  const shown = lines.slice(0, 12);
  if (lines.length > 12) shown.push(`...and ${lines.length - 12} more in your dashboard`);

  const bits: string[] = [];
  if (waiting.length) bits.push(`${waiting.length} waiting on you`);
  if (i.bookings.length) bits.push(`${i.bookings.length} booked today`);
  if (due.length) bits.push(`${due.length} to follow up`);
  if (fresh.length) bits.push(`${fresh.length} new`);

  return {
    empty: lines.length === 0,
    subject: `Your briefing: ${bits.join(", ") || "all quiet"}`,
    parts: {
      preheader: bits.join(" · "),
      heading: "Your morning briefing",
      paragraphs: [`Here's where ${i.channelName} stands this morning.`],
      bullets: shown,
      button: { label: "Open your dashboard", url: `${SITE_URL}/dashboard` },
      footerNote: "This briefing comes with your Channel assistant. Questions? Email support@hublinkpro.com.",
    },
  };
}

// Today's date and day bounds in Eastern time, as UTC instants.
export function etToday(now = new Date()): { date: string; startIso: string; endIso: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(now).map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  const h = Number(p.hour) % 24;
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), h, Number(p.minute), Number(p.second));
  const offsetMs = Math.round((asUtc - now.getTime()) / 60000) * 60000;
  const startMs = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)) - offsetMs;
  return { date: `${p.year}-${p.month}-${p.day}`, startIso: new Date(startMs).toISOString(), endIso: new Date(startMs + 24 * 3600 * 1000).toISOString() };
}
