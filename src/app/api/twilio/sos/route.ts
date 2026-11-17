import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITE_BASE, readTwilioForm, twiml, verifyTwilioSignature, xmlEscape } from "@/lib/twilio";
import { ETA_KEYS, categoryLabel } from "@/lib/sos";

// Twilio fetches this when a pro answers the SOS call. Two passes: the prompt, then the keypress.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const rid = Number(url.searchParams.get("rid"));
  const cid = Number(url.searchParams.get("cid"));
  const params = await readTwilioForm(req);
  if (!process.env.TWILIO_AUTH_TOKEN) return new Response("not configured", { status: 503 });
  // Twilio signs the full URL including the query string.
  if (!verifyTwilioSignature(`${SITE_BASE}/api/twilio/sos${url.search}`, params, req.headers.get("x-twilio-signature"))) {
    console.warn("[HLP-TWILIO] sos: bad signature");
    return new Response("forbidden", { status: 403 });
  }
  const db = supabaseAdmin();
  if (!db || !Number.isInteger(rid) || !Number.isInteger(cid)) return twiml("<Hangup/>");

  const { data: r } = await db.from("sos_requests").select("id,zip,category,status,claimed_channel_id").eq("id", rid).maybeSingle();
  if (!r) return twiml("<Hangup/>");
  const self = `${SITE_BASE}/api/twilio/sos?rid=${rid}&amp;cid=${cid}`;
  const digit = params.Digits;

  if (!digit) {
    if (r.status !== "open") return twiml(`<Say>Sorry, this job was already taken. Thank you.</Say><Hangup/>`);
    return twiml(
      `<Gather numDigits="1" timeout="8" action="${self}"><Say>HubLinkPro emergency. ${xmlEscape(categoryLabel(r.category))} in zip ${r.zip.split("").join(" ")}. ` +
      `Press 1 for 15 minutes, 2 for 30, 3 for 45, or 4 for 60 minutes to take this job. Press 9 to pass.</Say></Gather><Say>No answer. Goodbye.</Say><Hangup/>`
    );
  }

  const eta = ETA_KEYS[digit];
  if (!eta) {
    await db.from("sos_dispatches").update({ response: "declined", responded_at: new Date().toISOString() }).eq("request_id", rid).eq("channel_id", cid);
    return twiml(`<Say>Okay, passed. Goodbye.</Say><Hangup/>`);
  }
  const { data: won } = await db.rpc("sos_claim", { p_request: rid, p_channel: cid, p_eta: eta });
  await db.from("sos_dispatches").update({ response: won ? "accepted" : "declined", responded_at: new Date().toISOString() }).eq("request_id", rid).eq("channel_id", cid);
  if (!won) return twiml(`<Say>Sorry, another pro just took this job. Thank you.</Say><Hangup/>`);

  const { data: full } = await db.from("sos_requests").select("name,phone,problem").eq("id", rid).single();
  const phone = (full?.phone ?? "").replace("+1", "").split("").join(" ");
  return twiml(`<Say>You got it. Customer ${xmlEscape(full?.name ?? "")}. Phone ${phone}. We are texting you the details now.</Say><Hangup/>`);
}
