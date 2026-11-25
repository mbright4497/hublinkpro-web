import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendConsentedSms } from "@/lib/sms";
import { buildReminderText, isTomorrow, justBooked, type ReminderChannel } from "@/lib/reminders";

export const dynamic = "force-dynamic";

// Daily appointment reminders (Vercel Cron, see vercel.json): texts each customer whose booking is TOMORROW
// in the Channel's own time zone. Only people who checked the consent box are texted, and opt-outs and
// quiet hours are enforced by sendConsentedSms. Nothing is sent unless REMINDERS_ENABLED=true;
// otherwise it reports what WOULD be sent. ?dry=1 forces a dry run.
const LABEL = "Appointment reminder text to customer";
const CAP = 100; // per run

type Booking = { id: number; channel_id: number; starts_at: string; phone: string; sms_consent: boolean; created_at: string };
type Channel = ReminderChannel & { id: number; status: string };

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 503 });

  // Reminders are texts, so they also need the consented-text switch. Without it nothing is claimed or sent.
  const live = process.env.REMINDERS_ENABLED === "true" && process.env.SMS_TRANSACTIONAL_ENABLED === "true" && new URL(req.url).searchParams.get("dry") !== "1";
  const out: { live: boolean; sent: number[]; wouldSend: { bookingId: number; channelId: number; text: string }[]; skipped: string[]; failed: string[] } = { live, sent: [], wouldSend: [], skipped: [], failed: [] };

  // Wide window (every US zone's "tomorrow" fits inside it); the per-Channel time zone check below decides.
  const now = new Date();
  const from = now.toISOString();
  const to = new Date(now.getTime() + 60 * 3600_000).toISOString();
  const { data: rows, error } = await db
    .from("bookings")
    .select("id,channel_id,starts_at,phone,sms_consent,created_at")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("starts_at", from)
    .lt("starts_at", to)
    .order("starts_at")
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const bookings = (rows ?? []) as Booking[];
  if (!bookings.length) return NextResponse.json(out);

  const ids = [...new Set(bookings.map((b) => b.channel_id))];
  const { data: chs } = await db.from("channels").select("id,name,phone,booking_timezone,status").in("id", ids);
  const byId = new Map((chs ?? []).map((c) => [c.id as number, c as Channel]));

  let budget = CAP;
  for (const b of bookings) {
    const ch = byId.get(b.channel_id);
    if (!ch || ch.status !== "live") { out.skipped.push(`${b.id}: channel not live`); continue; }
    const tz = ch.booking_timezone || "America/New_York";
    if (!isTomorrow(b.starts_at, tz, now)) continue; // not due yet; tomorrow's run will see it
    if (!b.sms_consent) { out.skipped.push(`${b.id}: no text consent`); continue; }
    if (justBooked(b.created_at, now)) { out.skipped.push(`${b.id}: just booked`); continue; }
    const text = buildReminderText(ch, b.starts_at);
    if (!live) { out.wouldSend.push({ bookingId: b.id, channelId: ch.id, text }); continue; }
    if (budget-- <= 0) { out.skipped.push(`${b.id}: run cap reached`); continue; }

    // Claim first (only one run can flip reminder_sent_at from null), so overlapping runs never text twice.
    const { data: claimed } = await db.from("bookings").update({ reminder_sent_at: now.toISOString() }).eq("id", b.id).is("reminder_sent_at", null).select("id");
    if (!claimed?.length) continue;
    const result = await sendConsentedSms({ to: b.phone, body: text, consent: true, channelId: ch.id, label: LABEL });
    if (result === "sent") out.sent.push(b.id);
    else if (result === "failed") {
      await db.from("bookings").update({ reminder_sent_at: null }).eq("id", b.id); // let a re-run retry it
      out.failed.push(`${b.id}: send failed`);
    } else out.skipped.push(`${b.id}: not sent (opted out, quiet hours, or texting is off)`);
  }
  return NextResponse.json(out);
}
