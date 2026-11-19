import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ADMIN_EMAIL } from "@/lib/supabase/env";
import { sendEmail, SUPPORT_EMAIL } from "@/lib/notify";
import { buildNudge, type Candidate } from "@/lib/nudge";

export const dynamic = "force-dynamic";

// Runs daily from Vercel Cron (vercel.json). Vercel sends "Authorization: Bearer $CRON_SECRET".
// Nothing is emailed unless NUDGES_ENABLED=true; otherwise it only reports who WOULD get an email.
// Add ?dry=1 to force a dry run.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 503 });

  const live = process.env.NUDGES_ENABLED === "true" && new URL(req.url).searchParams.get("dry") !== "1";
  const result: { live: boolean; sent: { kind: string; email: string }[]; wouldSend: { kind: string; email: string; hasChannel: boolean }[]; failed: string[] } = {
    live, sent: [], wouldSend: [], failed: [],
  };
  let budget = 25; // cap per run

  for (const kind of ["day1", "day5"] as const) {
    const { data, error } = await db.rpc("signup_nudge_candidates", { p_kind: kind, p_admin_email: ADMIN_EMAIL });
    if (error) { result.failed.push(`${kind}: ${error.message}`); continue; }
    for (const c of (data ?? []) as Candidate[]) {
      if (!live) { result.wouldSend.push({ kind, email: c.email, hasChannel: c.has_channel }); continue; }
      if (budget-- <= 0) break;
      // Claim first (unique user_id+kind), so two overlapping runs can never both send.
      const { error: claimErr } = await db.from("signup_nudges").insert({ user_id: c.user_id, kind });
      if (claimErr) continue;
      const { subject, text, html } = buildNudge(kind, c);
      const ok = await sendEmail({ to: c.email, subject, text, html, replyTo: SUPPORT_EMAIL, log: { userId: c.user_id, label: `Signup nudge (${kind})` } });
      if (ok) result.sent.push({ kind, email: c.email });
      else {
        await db.from("signup_nudges").delete().eq("user_id", c.user_id).eq("kind", kind); // let tomorrow retry
        result.failed.push(`${kind}: send failed for ${c.email}`);
      }
    }
  }
  return NextResponse.json(result);
}
