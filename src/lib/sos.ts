// HLP SOS: emergency dispatch. First on-call Pro to accept wins. No bidding.
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITE_BASE, sendSms, startCall } from "@/lib/twilio";
import { sendEmail } from "@/lib/notify";

import { SOS_CATEGORIES, isSosCategory, categoryLabel } from "@/lib/sos-categories";
export { SOS_CATEGORIES, isSosCategory, categoryLabel };

export const ETA_KEYS: Record<string, number> = { "1": 15, "2": 30, "3": 45, "4": 60 };

export function hashIp(ip: string) {
  return createHash("sha256").update(`sos:${ip}`).digest("hex").slice(0, 32);
}

type Pro = { id: number; name: string; forward_to: string; tracking_number: string | null; zip_codes: string[] | null; owner_id: string | null };

// On-call Pro pros for a category. wave 1 = serve this ZIP; wave 2 = same ZIP or a nearby ZIP (same first 3 digits).
export async function onCallPros(category: string, zip: string, wave: 1 | 2): Promise<Pro[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data } = await db
    .from("channels")
    .select("id,name,forward_to,tracking_number,zip_codes,owner_id")
    .eq("status", "live").eq("tier", "pro").eq("on_call", true)
    .contains("sos_categories", [category])
    .lt("sos_strikes", 2)
    .not("forward_to", "is", null);
  const pros = (data ?? []) as Pro[];
  const here = pros.filter((p) => p.zip_codes?.includes(zip));
  if (wave === 1) return here.slice(0, 3);
  const near = pros.filter((p) => p.zip_codes?.some((z) => z.slice(0, 3) === zip.slice(0, 3)));
  return near;
}

// Whether the EMERGENCY button for a category should show in a ZIP.
export async function categoriesAvailable(zip: string): Promise<string[]> {
  const out: string[] = [];
  for (const c of SOS_CATEGORIES) {
    if ((await onCallPros(c.slug, zip, 2)).length) out.push(c.slug);
  }
  return out;
}

export async function dispatchWave(requestId: number, wave: 1 | 2) {
  const db = supabaseAdmin();
  if (!db) return 0;
  const { data: r } = await db.from("sos_requests").select("id,zip,category,status,verified_at").eq("id", requestId).maybeSingle();
  if (!r || r.status !== "open" || !r.verified_at) return 0; // never alert a pro for an unconfirmed request
  const pros = await onCallPros(r.category, r.zip, wave);
  const { data: already } = await db.from("sos_dispatches").select("channel_id").eq("request_id", requestId);
  const done = new Set((already ?? []).map((d) => d.channel_id));
  let sent = 0;
  for (const p of pros) {
    if (done.has(p.id)) continue;
    const from = process.env.TWILIO_SOS_NUMBER || p.tracking_number;
    if (!from) continue;
    const callSid = await startCall(
      from, p.forward_to,
      `${SITE_BASE}/api/twilio/sos?rid=${requestId}&cid=${p.id}`,
      `${SITE_BASE}/api/twilio/sos-status?rid=${requestId}&cid=${p.id}`
    );
    await db.from("sos_dispatches").insert({ request_id: requestId, channel_id: p.id, wave, method: "call", call_sid: callSid });
    await sendSms(from, p.forward_to, `HLP SOS: ${categoryLabel(r.category)} emergency in ${r.zip}. Answer our call and press 1-4 to take it (1=15 min, 2=30, 3=45, 4=60). First to accept wins. Reply STOP to opt out.`, { channelId: p.id, label: "SOS alert text to pro" });
    sent++;
  }
  return sent;
}

// Called whenever the homeowner's status page polls (no background worker on serverless).
// 2:00 widen to nearby pros. 10:00 alert Matt once.
export async function escalate(requestId: number) {
  const db = supabaseAdmin();
  if (!db) return;
  const { data: r } = await db.from("sos_requests").select("id,token,status,created_at,zip,category,name,phone,verified_at").eq("id", requestId).maybeSingle();
  if (!r || r.status !== "open") return;
  // Unconfirmed: nothing to escalate. Just let abandoned ones expire.
  if (!r.verified_at) {
    if (Date.now() - new Date(r.created_at).getTime() >= 1800_000) await db.from("sos_requests").update({ status: "expired" }).eq("id", requestId).eq("status", "open");
    return;
  }
  const age = (Date.now() - new Date(r.created_at).getTime()) / 1000;
  if (age >= 120 && age < 1800) await dispatchWave(requestId, 2);
  if (age >= 600) {
    // Atomic once-only guard: only the poll that flips admin_alerted_at sends the email.
    const { data: flipped } = await db
      .from("sos_requests").update({ admin_alerted_at: new Date().toISOString() })
      .eq("id", requestId).is("admin_alerted_at", null).select("id");
    const to = process.env.CONTACT_NOTIFY_EMAIL;
    if (flipped?.length && to) {
      await sendEmail({ to, subject: `SOS unclaimed 10+ min: ${categoryLabel(r.category)} in ${r.zip}`, text: `${r.name} ${r.phone} has had no taker for 10 minutes. Status page: ${SITE_BASE}/sos/${r.token}` });
    }
  }
  if (age >= 1800) await db.from("sos_requests").update({ status: "expired" }).eq("id", requestId).eq("status", "open");
}

// Homeowner says the pro never showed (only allowed once ETA + 15 min has passed). Strike the pro,
// reopen the request with fresh timers, and dispatch again. The no-show pro is never re-called.
export async function reportNoShow(token: string): Promise<"ok" | "too_early" | "invalid"> {
  const db = supabaseAdmin();
  if (!db) return "invalid";
  const { data: r } = await db.from("sos_requests").select("id,status,claimed_at,eta_minutes,claimed_channel_id").eq("token", token).maybeSingle();
  if (!r || r.status !== "claimed" || !r.claimed_channel_id || !r.claimed_at) return "invalid";
  const dueMs = new Date(r.claimed_at).getTime() + ((r.eta_minutes ?? 60) + 15) * 60_000;
  if (Date.now() < dueMs) return "too_early";
  // Atomic: only the call that flips claimed -> open gets to add the strike.
  const { data: flipped } = await db.from("sos_requests")
    .update({ status: "open", claimed_channel_id: null, claimed_at: null, eta_minutes: null, created_at: new Date().toISOString(), admin_alerted_at: null })
    .eq("id", r.id).eq("status", "claimed").eq("claimed_channel_id", r.claimed_channel_id).select("id");
  if (!flipped?.length) return "invalid";
  const { data: ch } = await db.from("channels").select("sos_strikes").eq("id", r.claimed_channel_id).single();
  await db.from("channels").update({ sos_strikes: (ch?.sos_strikes ?? 0) + 1 }).eq("id", r.claimed_channel_id);
  await dispatchWave(r.id, 1);
  return "ok";
}

// Median minutes from request to accept for a pro, shown after 5 SOS jobs.
export async function answerStat(channelId: number): Promise<{ jobs: number; medianMin: number | null }> {
  const db = supabaseAdmin();
  if (!db) return { jobs: 0, medianMin: null };
  const { data } = await db.from("sos_requests").select("created_at,claimed_at,status").eq("claimed_channel_id", channelId).in("status", ["claimed", "arrived", "done"]);
  const mins = (data ?? []).filter((r) => r.claimed_at).map((r) => (new Date(r.claimed_at!).getTime() - new Date(r.created_at).getTime()) / 60000).sort((a, b) => a - b);
  if (mins.length < 5) return { jobs: mins.length, medianMin: null };
  return { jobs: mins.length, medianMin: Math.max(1, Math.round(mins[Math.floor(mins.length / 2)])) };
}
