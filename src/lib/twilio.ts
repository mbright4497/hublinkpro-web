// Twilio helpers: webhook signature check, TwiML, phone cleanup, SMS send (raw fetch, no SDK).
import { createHmac, timingSafeEqual } from "node:crypto";

// Twilio signs the exact public URL it called, so build it from a fixed base, not request headers.
export const SITE_BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://hublinkpro.com").replace(/\/$/, "");

export function verifyTwilioSignature(url: string, params: Record<string, string>, signature: string | null) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !signature) return false;
  const data = Object.keys(params).sort().reduce((acc, k) => acc + k + params[k], url);
  const expected = createHmac("sha1", token).update(data).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function readTwilioForm(req: Request) {
  const text = await req.text();
  const params: Record<string, string> = {};
  new URLSearchParams(text).forEach((v, k) => { params[k] = v; });
  return params;
}

export const xmlEscape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function twiml(inner: string, status = 200) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`, {
    status,
    headers: { "Content-Type": "text/xml" },
  });
}

// US numbers only for now: "(423) 555-0100", "423-555-0100", "+14235550100" all become +14235550100.
export function toE164(input: string): string | null {
  const digits = input.replace(/[^0-9]/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function sendSms(from: string, to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    console.warn("[HLP-TWILIO] sms skipped: TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set");
    return false;
  }
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
    });
    if (!res.ok) {
      console.error("[HLP-TWILIO] sms failed", res.status, (await res.text()).slice(0, 300));
      return false;
    }
    console.log("[HLP-TWILIO] sms sent");
    return true;
  } catch (e) {
    console.error("[HLP-TWILIO] sms error", String(e));
    return false;
  }
}
