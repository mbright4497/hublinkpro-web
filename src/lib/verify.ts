// Consumer verification: a request reaches a pro only after the sender confirms a texted 6-digit code.
// Codes are stored hashed, expire in 10 minutes, allow 5 tries, and sends are rate limited per phone and per device.
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendSms, toE164, verifyCheck, verifyServiceSid, verifyStart } from "@/lib/twilio";
import { BOOKING_CONSENT_TEXT } from "@/lib/booking";
import { dispatchWave } from "@/lib/sos";

export type VerifyKind = "booking" | "sos";
type Fail = { ok: false; error: string; status: number };

const TTL_MS = 10 * 60_000;
const MAX_TRIES = 5;
const RESEND_GAP_MS = 30_000;
const PHONE_PER_HOUR = 4;
const IP_PER_HOUR = 12;

// Without Twilio Verify, codes go out as a plain text from our own number (needs A2P 10DLC approval to be reliable).
const sender = () => process.env.TWILIO_VERIFY_NUMBER || process.env.TWILIO_SOS_NUMBER || null;
const hashCode = (token: string, code: string) => createHash("sha256").update(`verify:${token}:${code}`).digest("hex");
const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
const sameHash = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function isBlocked(phone: string | null, email: string | null): Promise<boolean> {
  const db = supabaseAdmin();
  if (!db) return false;
  const p = phone ? toE164(phone) : null;
  const e = email ? email.trim().toLowerCase() : null;
  const checks: Promise<boolean>[] = [];
  if (p) checks.push(Promise.resolve(db.from("blocked_contacts").select("id", { head: true, count: "exact" }).eq("kind", "phone").eq("value", p)).then((r) => (r.count ?? 0) > 0));
  if (e) checks.push(Promise.resolve(db.from("blocked_contacts").select("id", { head: true, count: "exact" }).eq("kind", "email").eq("value", e)).then((r) => (r.count ?? 0) > 0));
  return (await Promise.all(checks)).some(Boolean);
}

async function overLimit(phone: string, ipHash: string | null): Promise<boolean> {
  const db = supabaseAdmin();
  if (!db) return true;
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { data: p } = await db.from("request_verifications").select("sends").eq("phone", phone).gte("created_at", since);
  if ((p ?? []).reduce((n, r) => n + r.sends, 0) >= PHONE_PER_HOUR) return true;
  if (ipHash) {
    const { data: i } = await db.from("request_verifications").select("sends").eq("ip_hash", ipHash).gte("created_at", since);
    if ((i ?? []).reduce((n, r) => n + r.sends, 0) >= IP_PER_HOUR) return true;
  }
  return false;
}

async function textCode(phone: string, code: string, channelId?: number) {
  const from = sender();
  if (!from) { console.warn("[HLP-VERIFY] no TWILIO_VERIFY_NUMBER / TWILIO_SOS_NUMBER set"); return false; }
  return sendSms(from, phone, `HubLinkPro code: ${code}. It expires in 10 minutes. If you didn't ask for this, ignore it.`, { label: "Verification code", channelId });
}

// Create the code for a request and text it. `token` is the handle the page uses to enter the code.
export async function startVerification(opts: { kind: VerifyKind; requestId: number; phone: string; ipHash: string | null; token?: string; channelId?: number }): Promise<{ ok: true; token: string } | Fail> {
  const db = supabaseAdmin();
  if (!db) return { ok: false, error: "Something went wrong. Try again.", status: 503 };
  const phone = toE164(opts.phone);
  if (!phone) return { ok: false, error: "Enter a US mobile number so we can text you a code.", status: 400 };
  if (await overLimit(phone, opts.ipHash)) return { ok: false, error: "Too many tries. Please wait a bit and try again.", status: 429 };
  const token = opts.token ?? randomBytes(16).toString("hex");
  const viaVerify = !!verifyServiceSid();
  const code = newCode();
  const { error } = await db.from("request_verifications").insert({
    kind: opts.kind, request_id: opts.requestId, token, phone,
    code_hash: viaVerify ? "twilio" : hashCode(token, code), expires_at: new Date(Date.now() + TTL_MS).toISOString(), ip_hash: opts.ipHash,
  });
  if (error) return { ok: false, error: "Something went wrong. Try again.", status: 500 };
  const sent = viaVerify ? await verifyStart(phone) : await textCode(phone, code, opts.channelId);
  if (!sent) return { ok: false, error: "We couldn't text that number. Check it and try again.", status: 502 };
  return { ok: true, token };
}

export async function resendCode(token: string): Promise<{ ok: true } | Fail> {
  const db = supabaseAdmin();
  if (!db || !/^[0-9a-f]{32}$/.test(token)) return { ok: false, error: "Not found.", status: 404 };
  const { data: v } = await db.from("request_verifications").select("id,phone,sends,last_sent_at,verified_at,ip_hash,code_hash").eq("token", token).maybeSingle();
  if (!v || v.verified_at) return { ok: false, error: "Not found.", status: 404 };
  if (Date.now() - new Date(v.last_sent_at).getTime() < RESEND_GAP_MS) return { ok: false, error: "Give it a few seconds, then try again.", status: 429 };
  if (await overLimit(v.phone, v.ip_hash)) return { ok: false, error: "Too many tries. Please wait a bit and try again.", status: 429 };
  const viaVerify = v.code_hash === "twilio";
  const code = newCode();
  await db.from("request_verifications").update({
    code_hash: viaVerify ? "twilio" : hashCode(token, code), attempts: 0, sends: v.sends + 1,
    expires_at: new Date(Date.now() + TTL_MS).toISOString(), last_sent_at: new Date().toISOString(),
  }).eq("id", v.id);
  if (!(viaVerify ? await verifyStart(v.phone) : await textCode(v.phone, code))) return { ok: false, error: "We couldn't text that number.", status: 502 };
  return { ok: true };
}

export async function checkCode(token: string, rawCode: string): Promise<{ ok: true; kind: VerifyKind } | Fail> {
  const db = supabaseAdmin();
  const code = rawCode.replace(/\D/g, "");
  if (!db || !/^[0-9a-f]{32}$/.test(token) || code.length !== 6) return { ok: false, error: "Enter the 6-digit code.", status: 400 };
  const { data: v } = await db.from("request_verifications").select("id,kind,request_id,phone,code_hash,attempts,expires_at,verified_at").eq("token", token).maybeSingle();
  if (!v) return { ok: false, error: "Not found.", status: 404 };
  if (v.verified_at) return { ok: true, kind: v.kind as VerifyKind };
  if (new Date(v.expires_at).getTime() < Date.now()) return { ok: false, error: "That code expired. Tap “Text me a new code.”", status: 410 };
  if (v.attempts >= MAX_TRIES) return { ok: false, error: "Too many wrong tries. Tap “Text me a new code.”", status: 429 };
  let right: boolean;
  if (v.code_hash === "twilio") {
    const r = await verifyCheck(v.phone, code);
    if (r === "gone") return { ok: false, error: "That code expired. Tap “Text me a new code.”", status: 410 };
    if (r === "error") return { ok: false, error: "Something went wrong. Try again.", status: 502 };
    right = r === "approved";
  } else {
    right = sameHash(v.code_hash, hashCode(token, code));
  }
  if (!right) {
    // Optimistic bump: if two guesses race, only one lands, so the cap holds.
    await db.from("request_verifications").update({ attempts: v.attempts + 1 }).eq("id", v.id).eq("attempts", v.attempts);
    return { ok: false, error: "That code isn't right. Check the text and try again.", status: 400 };
  }
  const { data: flipped } = await db.from("request_verifications").update({ verified_at: new Date().toISOString() })
    .eq("id", v.id).is("verified_at", null).select("id");
  if (flipped?.length) await releaseRequest(v.kind as VerifyKind, v.request_id);
  return { ok: true, kind: v.kind as VerifyKind };
}

// The moment a request becomes real: stamp it confirmed, then hand it to the pro.
async function releaseRequest(kind: VerifyKind, requestId: number) {
  const db = supabaseAdmin();
  if (!db) return;
  const now = new Date().toISOString();
  if (kind === "sos") {
    // Timers (2:00 widen, 10:00 alert, 30:00 expire) start at confirmation, not at tap.
    const { data } = await db.from("sos_requests").update({ verified_at: now, created_at: now }).eq("id", requestId).is("verified_at", null).eq("status", "open").select("id");
    if (data?.length) await dispatchWave(requestId, 1);
    return;
  }
  const { data: r } = await db.from("booking_requests")
    .update({ verified_at: now }).eq("id", requestId).is("verified_at", null)
    .select("channel_id,name,phone,email,service,message,preferred_time,sms_consent").maybeSingle();
  if (!r) return;
  const { data: ch } = await db.from("channels").select("name,slug").eq("id", r.channel_id).maybeSingle();
  // Best-effort hand-off to GoHighLevel. The request is already saved, so this never blocks the visitor.
  if (process.env.HLP_INTAKE_WEBHOOK_URL) {
    try {
      await fetch(process.env.HLP_INTAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "booking-request", channel: ch?.name, channel_slug: ch?.slug,
          name: r.name, phone: r.phone, email: r.email, service: r.service, message: r.message, preferred_time: r.preferred_time,
          sms_consent: r.sms_consent, sms_consent_text: r.sms_consent ? BOOKING_CONSENT_TEXT : null,
          phone_verified: true, received_at: now,
        }),
      });
    } catch (e) {
      console.error("[HLP-BOOKING] webhook error", String(e));
    }
  }
}
