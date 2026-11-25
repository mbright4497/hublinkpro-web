// Day-before appointment reminders. Pure helpers, no I/O, so the wording and the "is it tomorrow" rule
// can be tested without a database. The cron route (/api/cron/reminders) does the sending.
import { addDays, dayKey, fmtWhen, tzLabel } from "@/lib/booking";
import { fmtPhone } from "@/lib/crm";

export type ReminderChannel = { name: string; phone: string | null; booking_timezone: string | null };

const DEFAULT_TZ = "America/New_York";

/** True when the booking falls on the calendar day after `now`, as seen in the Channel's own time zone. */
export function isTomorrow(startsAtIso: string, tz: string, now: Date = new Date()): boolean {
  return dayKey(startsAtIso, tz) === addDays(dayKey(now, tz), 1);
}

/** A booking made in the last few hours already got its confirmation; a reminder right behind it is noise. */
export function justBooked(createdAtIso: string, now: Date = new Date(), hours = 6): boolean {
  return now.getTime() - new Date(createdAtIso).getTime() < hours * 3600_000;
}

/**
 * The reminder text. Works for any business: it only uses the Channel's own name, phone and time zone.
 * Same opening and STOP/HELP footer as the booking confirmation text that passed the A2P review.
 */
export function buildReminderText(ch: ReminderChannel, startsAtIso: string): string {
  const tz = ch.booking_timezone || DEFAULT_TZ;
  const name = ch.name.trim().slice(0, 60);
  const phone = fmtPhone(ch.phone);
  const change = phone ? `To change it, call ${phone}.` : `To change it, contact ${name} directly.`;
  return `HubLinkPro: Reminder: your appointment with ${name} is tomorrow, ${fmtWhen(startsAtIso, tz)} ${tzLabel(tz)}. ${change} Reply STOP to opt out, HELP for help.`;
}
