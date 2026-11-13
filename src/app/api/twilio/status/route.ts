import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITE_BASE, readTwilioForm, sendSms, twiml, verifyTwilioSignature } from "@/lib/twilio";

// Twilio calls this when the forwarded leg ends. Record the outcome, and if the call was
// missed and the owner turned text-back on, text the caller a link to the Channel (once per
// caller per 24 hours).
export async function POST(req: Request) {
  const params = await readTwilioForm(req);
  if (!process.env.TWILIO_AUTH_TOKEN) return new Response("not configured", { status: 503 });
  if (!verifyTwilioSignature(`${SITE_BASE}/api/twilio/status`, params, req.headers.get("x-twilio-signature"))) {
    console.warn("[HLP-TWILIO] status: bad signature");
    return new Response("forbidden", { status: 403 });
  }

  const done = twiml("<Hangup/>");
  const db = supabaseAdmin();
  if (!db) return done;

  const outcome = params.DialCallStatus;
  const status = outcome === "completed" ? "answered" : outcome === "failed" ? "failed" : "missed";
  const seconds = Number(params.DialCallDuration);

  const { data: log } = await db
    .from("call_logs")
    .update({ status, duration_seconds: Number.isFinite(seconds) ? seconds : null })
    .eq("call_sid", params.CallSid)
    .select("id,channel_id,from_number")
    .maybeSingle();
  if (!log || status === "answered") return done;

  const { data: ch } = await db
    .from("channels")
    .select("name,slug,tracking_number,missed_call_text,status")
    .eq("id", log.channel_id)
    .maybeSingle();
  if (!ch || !ch.missed_call_text || ch.status !== "live" || !ch.tracking_number) return done;
  if (!log.from_number || !/^\+[1-9][0-9]{7,14}$/.test(log.from_number)) return done; // blocked / private caller

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("call_logs")
    .select("id", { count: "exact", head: true })
    .eq("channel_id", log.channel_id)
    .eq("from_number", log.from_number)
    .eq("texted", true)
    .gte("created_at", since);
  if (count) return done;

  const body = `Sorry we missed your call to ${ch.name}. Book a time or send details here: ${SITE_BASE}/channel/${ch.slug} Reply STOP to opt out.`;
  if (await sendSms(ch.tracking_number, log.from_number, body)) {
    await db.from("call_logs").update({ texted: true }).eq("id", log.id);
  }
  return done;
}
