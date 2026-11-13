// Shared helpers for native booking. All times are stored as UTC instants and shown in the
// Channel's own time zone, so a visitor in another zone still sees the business's local time.

export const TIMEZONES: { value: string; label: string }[] = [
  { value: "America/New_York", label: "Eastern" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
];

export const SLOT_LENGTHS = [15, 30, 45, 60, 90, 120];
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** YYYY-MM-DD for an instant, as seen in the given time zone. */
export function dayKey(iso: string | Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    typeof iso === "string" ? new Date(iso) : iso,
  );
}

/** Add whole days to a YYYY-MM-DD string (calendar math, no time zone involved). */
export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-");
  const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d) + n));
  return dt.toISOString().slice(0, 10);
}

export function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function fmtDayLabel(ymd: string): { dow: string; md: string } {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return {
    dow: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(dt),
    md: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(dt),
  };
}

/** "Saturday, Nov 15 at 9:00 AM" in the Channel's time zone. */
export function fmtWhen(iso: string, tz: string): string {
  const day = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "short", day: "numeric" }).format(new Date(iso));
  return `${day} at ${fmtTime(iso, tz)}`;
}

export function tzLabel(tz: string): string {
  return TIMEZONES.find((t) => t.value === tz)?.label ?? tz;
}
