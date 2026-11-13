// Best-effort email helpers for booking. Every function here swallows failures: a booking is
// already saved by the time these run, so an email problem must never break the visitor's flow.
// Resend is called with raw fetch (no SDK). Missing keys just mean "skip quietly".
import { SUPABASE_URL } from "@/lib/supabase/env";

const FROM = "HubLinkPro <login@hublinkpro.com>";

export async function sendEmail(opts: { to: string; subject: string; text: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) console.error("[HLP-EMAIL] resend failed", res.status);
    return res.ok;
  } catch (e) {
    console.error("[HLP-EMAIL] error", String(e));
    return false;
  }
}

// The owner's sign-in email lives in auth, which only the service role can read. This is
// server-only and optional: without SUPABASE_SERVICE_ROLE_KEY the owner simply gets no email
// alert and sees the booking in their dashboard.
export async function ownerEmail(ownerId: string): Promise<string | null> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !/^[0-9a-f-]{36}$/i.test(ownerId)) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${ownerId}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const u = (await res.json()) as { email?: string };
    return u.email ?? null;
  } catch {
    return null;
  }
}
