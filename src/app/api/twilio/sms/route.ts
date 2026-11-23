import { SITE_BASE, readTwilioForm, twiml, verifyTwilioSignature } from "@/lib/twilio";
import { recordOptChange } from "@/lib/sms";
import { logMessage } from "@/lib/msglog";

export const dynamic = "force-dynamic";

// Inbound texts on the HubLinkPro Messaging Service. Twilio's Advanced Opt-Out already answers
// STOP / START / HELP; this records opt-outs on our side so every send checks them, and logs the message.
export async function POST(req: Request) {
  const params = await readTwilioForm(req);
  if (!verifyTwilioSignature(`${SITE_BASE}/api/twilio/sms`, params, req.headers.get("x-twilio-signature"))) {
    return new Response("forbidden", { status: 403 });
  }
  const from = params.From ?? "";
  const body = params.Body ?? "";
  const change = await recordOptChange(from, body, params.OptOutType);
  await logMessage({ label: change === "out" ? "Inbound text: STOP" : change === "in" ? "Inbound text: START" : "Inbound text", medium: "sms", to: from, body, ok: true });
  return twiml(""); // no reply from us; Twilio handles the opt-out/help auto-replies
}
