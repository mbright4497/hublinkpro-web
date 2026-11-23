// Real automation activity: what Link actually did, shown back to visitors.
// Writes use the service role (the tables only accept those). Reads are public and use plain REST
// with a 60s revalidate so cached pages stay cacheable. Nothing here is simulated: an event row
// exists only because an email really went out.
import { SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Called right after the customer's confirmation email is sent. Stamps the lead's first Link reply
// (so the response-time badge has data) and adds one sanitized, delayed row to the public feed.
// Best-effort: never throws, never blocks the visitor.
export async function recordRequestReply(o: { channelId: number; channelName: string; city?: string | null; marketId?: number | null; phone: string; startedAt: number }) {
  try {
    const db = supabaseAdmin();
    if (!db) { console.warn("[HLP-AUTO] skipped: SUPABASE_SERVICE_ROLE_KEY is not set"); return; }
    const key = o.phone.replace(/\D/g, "").slice(-10);
    if (key.length >= 7) {
      // Only a lead created by this very request counts, so an old lead never gets a huge "reply time".
      const { error } = await db
        .from("leads")
        .update({ link_replied_at: new Date().toISOString() })
        .eq("channel_id", o.channelId)
        .eq("phone_key", key)
        .is("link_replied_at", null)
        .gte("created_at", new Date(o.startedAt - 10_000).toISOString());
      if (error) console.error("[HLP-AUTO] link_replied_at failed:", error.message);
    }
    const { error } = await db.from("automation_events").insert({
      kind: "request_confirmed",
      channel_id: o.channelId,
      market_id: o.marketId ?? null,
      public_text: `A request to ${o.channelName}${o.city ? ` in ${o.city}` : ""} was confirmed instantly.`,
      duration_ms: Math.max(0, Date.now() - o.startedAt),
    });
    if (error) console.error("[HLP-AUTO] event insert failed:", error.message);
  } catch (e) {
    console.error("[HLP-AUTO] failed", String(e));
  }
}

const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

// How fast this Channel gets back to people. Medians stay null until there are 5 real samples
// (enforced in the database). Link and owner are reported separately, never blended.
export async function responseBadge(channelId: number): Promise<{ linkSec: number | null; ownerSec: number | null }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/channel_response_stats`, {
      method: "POST",
      headers: { ...H, "Content-Type": "application/json" },
      body: JSON.stringify({ p_channel_id: channelId }),
      next: { revalidate: 60 },
    });
    if (!res.ok) return { linkSec: null, ownerSec: null };
    const rows = (await res.json()) as { link_median_seconds: number | null; owner_median_seconds: number | null }[];
    return { linkSec: rows[0]?.link_median_seconds ?? null, ownerSec: rows[0]?.owner_median_seconds ?? null };
  } catch {
    return { linkSec: null, ownerSec: null };
  }
}

export type AutomationSnapshot = { count: number; medianSec: number | null; recent: { text: string; at: string }[] };

// Public feed: only rows past their 10-minute delay (RLS enforces it too).
export async function automationSnapshot(): Promise<AutomationSnapshot> {
  const empty = { count: 0, medianSec: null, recent: [] };
  try {
    const now = encodeURIComponent(new Date().toISOString());
    const res = await fetch(`${SUPABASE_URL}/rest/v1/automation_events?select=public_text,duration_ms,created_at&visible_at=lte.${now}&order=created_at.desc&limit=200`, { headers: H, next: { revalidate: 60 } });
    if (!res.ok) return empty;
    const rows = (await res.json()) as { public_text: string; duration_ms: number | null; created_at: string }[];
    if (!rows.length) return empty;
    const ms = rows.map((r) => r.duration_ms).filter((n): n is number => typeof n === "number").sort((a, b) => a - b);
    const medianSec = ms.length >= 5 ? Math.max(1, Math.round(ms[Math.floor(ms.length / 2)] / 1000)) : null;
    return { count: rows.length, medianSec, recent: rows.slice(0, 3).map((r) => ({ text: r.public_text, at: r.created_at })) };
  } catch {
    return empty;
  }
}

export const fmtSeconds = (s: number) => (s < 60 ? `${s} sec` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.round(s / 3600)} hr`);

export function ago(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} hr ago` : `${Math.round(m / 1440)} d ago`;
}
