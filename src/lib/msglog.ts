// Records each email/SMS the site sends so the admin can see communication per Channel.
// Best-effort: a logging problem must never break the send or the visitor's flow.
import { supabaseAdmin } from "@/lib/supabase/admin";

export type LogMeta = { channelId?: number | null; userId?: string | null; label: string };

export async function logMessage(m: LogMeta & { medium: "email" | "sms"; to: string; subject?: string; body: string; ok: boolean }) {
  try {
    const db = supabaseAdmin();
    if (!db) return;
    await db.from("message_log").insert({
      channel_id: m.channelId ?? null,
      user_id: m.userId ?? null,
      medium: m.medium,
      label: m.label,
      to_addr: m.to,
      subject: m.subject ?? null,
      body: m.body.slice(0, 2000),
      ok: m.ok,
    });
  } catch (e) {
    console.error("[HLP-LOG] failed", String(e));
  }
}
