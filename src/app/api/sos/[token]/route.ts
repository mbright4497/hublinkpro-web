import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { escalate, reportNoShow } from "@/lib/sos";

export const dynamic = "force-dynamic";

// Homeowner status poll. Also drives the 2:00 / 10:00 escalation steps.
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const db = supabaseAdmin();
  if (!db || !/^[0-9a-f]{32}$/.test(token)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { data: r } = await db.from("sos_requests").select("id,status,category,zip,eta_minutes,claimed_channel_id,created_at,verified_at").eq("token", token).maybeSingle();
  if (!r) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (r.status === "open" && !r.verified_at) {
    await escalate(r.id);
    return NextResponse.json({ status: "unverified" });
  }
  if (r.status === "open") await escalate(r.id);
  const { data: fresh } = await db.from("sos_requests").select("status,eta_minutes,claimed_channel_id,created_at,claimed_at,category").eq("id", r.id).single();
  let pro: { name: string; slug: string; phone: string | null } | null = null;
  if (fresh?.claimed_channel_id) {
    const { data: ch } = await db.from("channels").select("name,slug,forward_to").eq("id", fresh.claimed_channel_id).maybeSingle();
    if (ch) pro = { name: ch.name, slug: ch.slug, phone: ch.forward_to };
  }
  // After 5 minutes unclaimed, show the 3 nearest on-call pros for tap-to-call.
  let fallback: { name: string; phone: string }[] = [];
  if (fresh?.status === "open" && Date.now() - new Date(fresh.created_at).getTime() > 300_000) {
    const { onCallPros } = await import("@/lib/sos");
    fallback = (await onCallPros(r.category, r.zip, 2)).slice(0, 3).map((p) => ({ name: p.name, phone: p.forward_to }));
  }
  const lateAfter = fresh?.claimed_at ? new Date(fresh.claimed_at).getTime() + ((fresh.eta_minutes ?? 60) + 15) * 60_000 : null;
  const canReportNoShow = fresh?.status === "claimed" && lateAfter !== null && Date.now() >= lateAfter;
  return NextResponse.json({ status: fresh?.status, eta: fresh?.eta_minutes, pro, fallback, createdAt: fresh?.created_at, canReportNoShow });
}

// Homeowner: "they never showed".
export async function POST(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!/^[0-9a-f]{32}$/.test(token)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const result = await reportNoShow(token);
  return NextResponse.json({ result }, { status: result === "ok" ? 200 : 409 });
}
