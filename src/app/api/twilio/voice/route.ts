import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITE_BASE, readTwilioForm, twiml, verifyTwilioSignature, xmlEscape } from "@/lib/twilio";

// Twilio calls this when someone dials a Channel's tracking number.
// We log the call and ring the owner's real phone; /api/twilio/status hears how it ended.
export async function POST(req: Request) {
  const params = await readTwilioForm(req);
  if (!process.env.TWILIO_AUTH_TOKEN) {
    console.error("[HLP-TWILIO] voice: TWILIO_AUTH_TOKEN is not set");
    return new Response("not configured", { status: 503 });
  }
  if (!verifyTwilioSignature(`${SITE_BASE}/api/twilio/voice`, params, req.headers.get("x-twilio-signature"))) {
    console.warn("[HLP-TWILIO] voice: bad signature");
    return new Response("forbidden", { status: 403 });
  }

  const db = supabaseAdmin();
  const notInService = twiml(`<Say>Sorry, this number is not in service right now. Goodbye.</Say><Hangup/>`);
  if (!db) {
    console.error("[HLP-TWILIO] voice: SUPABASE_SERVICE_ROLE_KEY is not set");
    return notInService;
  }

  const { data: ch } = await db
    .from("channels")
    .select("id,forward_to,status")
    .eq("tracking_number", params.To ?? "")
    .maybeSingle();
  if (!ch || ch.status !== "live" || !ch.forward_to) return notInService;

  const { error } = await db
    .from("call_logs")
    .upsert({ channel_id: ch.id, call_sid: params.CallSid, from_number: params.From ?? null }, { onConflict: "call_sid", ignoreDuplicates: true });
  if (error) console.error("[HLP-TWILIO] voice: could not log call", error.message); // still ring the phone

  // Present the forwarded call as coming from the tracking number (a number we own, so carriers trust it).
  // Passing the visitor's number through gets filtered as spoofed by many carriers (Twilio logged "Busy" at 0 sec).
  // The visitor's number is still in call_logs and the dashboard.
  return twiml(
    `<Dial timeout="20" callerId="${xmlEscape(params.To ?? "")}" action="${SITE_BASE}/api/twilio/status"><Number>${xmlEscape(ch.forward_to)}</Number></Dial>`
  );
}
