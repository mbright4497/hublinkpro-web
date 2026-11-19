import { supabaseServer } from "@/lib/supabase/server";
import { LEAD_COLUMNS, SOURCES, csvCell, fmtPhone, statusLabel, type Lead } from "@/lib/crm";

export const dynamic = "force-dynamic";

// Your leads are yours: one click downloads all of them as a spreadsheet file.
export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Please sign in.", { status: 401 });

  const { data: ch } = await supabase.from("channels").select("id,slug").eq("owner_id", user.id).order("id").limit(1).maybeSingle();
  if (!ch) return new Response("No Channel.", { status: 404 });

  const { data } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("channel_id", ch.id)
    .order("created_at", { ascending: true })
    .limit(2000);
  const leads = (data ?? []) as Lead[];

  const head = ["Name", "Phone", "Email", "Needs", "Where it came from", "Stage", "Job amount", "Follow up on", "Last activity", "First heard from"];
  const rows = leads.map((l) =>
    [
      l.name === l.phone ? fmtPhone(l.phone) : l.name,
      fmtPhone(l.phone),
      l.email,
      l.service,
      SOURCES[l.source] ?? l.source,
      statusLabel(l.status),
      l.value_cents != null ? (l.value_cents / 100).toFixed(2) : "",
      l.follow_up_on,
      l.last_activity_at.slice(0, 10),
      l.created_at.slice(0, 10),
    ]
      .map(csvCell)
      .join(","),
  );

  // The leading BOM makes Excel read names with accents correctly.
  const body = "﻿" + [head.map(csvCell).join(","), ...rows].join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ch.slug}-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
