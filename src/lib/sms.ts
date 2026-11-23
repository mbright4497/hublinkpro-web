// Consented transactional texts: quote/booking confirmations and owner lead alerts.
// These run on the approved A2P campaign ("Low Volume Mixed") and ONLY go to people who checked
// an SMS consent box. Separate from SMS_AUTOMATIONS_ENABLED, which keeps missed-call and SOS texts dark.
// Off unless SMS_TRANSACTIONAL_ENABLED=true. Every outcome except "flag off / no consent" is logged.
import { supabaseAdmin } from "@/lib/supabase/admin";
import { deliverViaService, toE164 } from "@/lib/twilio";
import { logMessage } from "@/lib/msglog";

const SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID || "MG650957eafff09c985c61f4738109bf86";

// Texts go out 8am-9pm Eastern only. Outside that window the email still goes; the text is skipped and logged.
export function inQuietHours(now = new Date()): boolean {
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }).format(now)) % 24;
  return h < 8 || h >= 21;
}

export type SmsResult = "sent" | "failed" | "skipped";

export async function sendConsentedSms(o: { to: string | null | undefined; body: string; consent: boolean; channelId?: number | null; label: string }): Promise<SmsResult> {
  if (process.env.SMS_TRANSACTIONAL_ENABLED !== "true") return "skipped";
  if (!o.consent || !o.to) return "skipped";
  const to = toE164(o.to);
  const skip = async (why: string): Promise<SmsResult> => {
    await logMessage({ channelId: o.channelId, label: `${o.label} (skipped: ${why})`, medium: "sms", to: to ?? o.to!, body: o.body, ok: false });
    return "skipped";
  };
  if (!to) return skip("bad number");
  if (inQuietHours()) return skip("quiet hours");
  const db = supabaseAdmin();
  if (!db) return skip("no database access");
  const { data: out, error } = await db.from("sms_optouts").select("id").eq("phone", to).maybeSingle();
  if (error) return skip("opt-out check failed"); // fail closed
  if (out) return skip("opted out");
  const ok = await deliverViaService(SERVICE_SID, to, o.body);
  await logMessage({ channelId: o.channelId, label: o.label, medium: "sms", to, body: o.body, ok });
  return ok ? "sent" : "failed";
}

const STOP = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "OPTOUT", "REVOKE"]);
const START = new Set(["START", "UNSTOP", "YES"]);

// Called by the inbound webhook. Twilio's Advanced Opt-Out sends the reply itself; this keeps our own record.
export async function recordOptChange(from: string, bodyText: string, optOutType?: string): Promise<"out" | "in" | null> {
  const phone = toE164(from);
  const db = supabaseAdmin();
  if (!phone || !db) return null;
  const word = bodyText.trim().toUpperCase();
  const t = (optOutType ?? "").toUpperCase();
  if (t === "STOP" || STOP.has(word)) {
    await db.from("sms_optouts").upsert({ phone, opted_out_at: new Date().toISOString(), source: "stop_reply" }, { onConflict: "phone" });
    return "out";
  }
  if (t === "START" || START.has(word)) {
    await db.from("sms_optouts").delete().eq("phone", phone);
    return "in";
  }
  return null;
}
