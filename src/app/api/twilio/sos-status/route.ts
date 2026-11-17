import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITE_BASE, readTwilioForm, sendSms, twiml, verifyTwilioSignature } from "@/lib/twilio";
import { categoryLabel } from "@/lib/sos";

// Call ended. If this pro won the job, text them the customer's details and text the homeowner who is coming.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const rid = Number(url.searchParams.get("rid"));
  const cid = Number(url.searchParams.get("cid"));
  const params = await readTwilioForm(req);
  if (!process.env.TWILIO_AUTH_TOKEN) return new Response("not configured", { status: 503 });
  if (!verifyTwilioSignature(`${SITE_BASE}/api/twilio/sos-status${url.search}`, params, req.headers.get("x-twilio-signature"))) {
    return new Response("forbidden", { status: 403 });
  }
  const done = twiml("<Hangup/>");
  const db = supabaseAdmin();
  if (!db || !Number.isInteger(rid) || !Number.isInteger(cid)) return done;
  const { data: r } = await db.from("sos_requests")
    .select("id,token,name,phone,problem,zip,category,eta_minutes,claimed_channel_id,sms_consent,status").eq("id", rid).maybeSingle();
  if (!r || r.claimed_channel_id !== cid || r.status !== "claimed") return done;
  const { data: ch } = await db.from("channels").select("name,forward_to,tracking_number").eq("id", cid).maybeSingle();
  const from = process.env.TWILIO_SOS_NUMBER || ch?.tracking_number;
  if (!ch || !from) return done;

  // Idempotent: the dispatch row's method 'sms' is the once-only marker.
  const { error } = await db.from("sos_dispatches").insert({ request_id: rid, channel_id: cid, wave: 0, method: "sms", response: "accepted" });
  if (error) return done;

  await sendSms(from, ch.forward_to!, `HLP SOS job: ${categoryLabel(r.category)}. ${r.name} ${r.phone}, zip ${r.zip}. ${r.problem ?? ""} Call them now. ETA promised: ${r.eta_minutes} min.`.trim());
  if (r.sms_consent) {
    await sendSms(from, r.phone, `HubLinkPro: ${ch.name} is on the way, about ${r.eta_minutes} min. Track it: ${SITE_BASE}/sos/${r.token} Reply STOP to opt out.`);
  }
  return done;
}
