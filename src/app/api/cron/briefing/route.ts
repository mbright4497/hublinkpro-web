import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, ownerEmail } from "@/lib/notify";
import { renderEmail } from "@/lib/email-template";
import { buildBriefing, etToday, type BriefLead, type BriefBooking } from "@/lib/briefing";

export const dynamic = "force-dynamic";

// Daily assistant briefing (Vercel Cron, see vercel.json). Only Channels with the 'briefing' feature get one.
// Nothing is emailed unless BRIEFING_ENABLED=true; otherwise it reports what WOULD be sent. ?dry=1 forces a dry run.
// A Channel with nothing to report gets no email, and one Channel never gets two on the same day.
const LABEL = "Morning briefing to owner";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 503 });

  const live = process.env.BRIEFING_ENABLED === "true" && new URL(req.url).searchParams.get("dry") !== "1";
  const out: { live: boolean; sent: number[]; wouldSend: { channelId: number; subject: string; lines: string[] }[]; skipped: string[] } = { live, sent: [], wouldSend: [], skipped: [] };

  const { data: feats } = await db.from("channel_features").select("channel_id").eq("feature", "briefing").eq("enabled", true);
  const ids = (feats ?? []).map((f) => f.channel_id as number);
  if (!ids.length) return NextResponse.json(out);

  const { data: channels } = await db.from("channels").select("id,name,owner_id,booking_timezone").in("id", ids).eq("status", "live");
  const now = new Date();
  const t = etToday(now);

  for (const ch of channels ?? []) {
    const { data: already } = await db.from("message_log").select("id").eq("channel_id", ch.id).eq("label", LABEL).gte("created_at", t.startIso).limit(1);
    if (already?.length) { out.skipped.push(`${ch.id}: already sent today`); continue; }

    const [{ data: leads }, { data: bookings }] = await Promise.all([
      db.from("leads").select("id,name,service,source,status,created_at,owner_first_touch_at,follow_up_on").eq("channel_id", ch.id).not("status", "in", "(won,lost)").order("created_at", { ascending: false }).limit(200),
      db.from("bookings").select("name,service,starts_at").eq("channel_id", ch.id).neq("status", "cancelled").gte("starts_at", t.startIso).lt("starts_at", t.endIso).order("starts_at"),
    ]);
    const b = buildBriefing({ channelName: ch.name, tz: ch.booking_timezone || "America/New_York", leads: (leads ?? []) as BriefLead[], bookings: (bookings ?? []) as BriefBooking[], nowMs: now.getTime(), todayEt: t.date });
    if (b.empty) { out.skipped.push(`${ch.id}: nothing to report`); continue; }
    if (!live) { out.wouldSend.push({ channelId: ch.id, subject: b.subject, lines: b.parts.bullets ?? [] }); continue; }

    const to = await ownerEmail(ch.owner_id);
    if (!to) { out.skipped.push(`${ch.id}: no owner email`); continue; }
    const ok = await sendEmail({ to, subject: b.subject, ...renderEmail(b.parts), log: { channelId: ch.id, label: LABEL } });
    if (ok) out.sent.push(ch.id); else out.skipped.push(`${ch.id}: send failed`);
  }
  return NextResponse.json(out);
}
