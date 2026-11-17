import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toE164 } from "@/lib/twilio";
import { dispatchWave, hashIp, isSosCategory, onCallPros } from "@/lib/sos";

export const dynamic = "force-dynamic";

// Homeowner taps EMERGENCY. Validates, stores, and dispatches wave 1 to on-call pros.
export async function POST(req: Request) {
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "bad" }, { status: 400 }); }

  const zip = String(b.zip ?? "").trim();
  const category = String(b.category ?? "");
  const name = String(b.name ?? "").trim().slice(0, 80);
  const phone = toE164(String(b.phone ?? ""));
  const problem = String(b.problem ?? "").trim().slice(0, 500) || null;
  const consent = b.sms_consent === true;
  if (!/^[0-9]{5}$/.test(zip) || !isSosCategory(category) || !name || !phone) {
    return NextResponse.json({ error: "Check your ZIP, name and phone." }, { status: 400 });
  }
  if (!consent) return NextResponse.json({ error: "Please agree to text updates so we can reach you." }, { status: 400 });

  // Abuse cap: 3 requests per IP per hour.
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = hashIp(ip);
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("sos_requests").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
  if ((count ?? 0) >= 3) return NextResponse.json({ error: "Too many requests. Call 911 for life-threatening emergencies." }, { status: 429 });

  if (!(await onCallPros(category, zip, 2)).length) {
    return NextResponse.json({ error: "No one is on call for that in your area right now." }, { status: 409 });
  }

  const { data: row, error } = await db
    .from("sos_requests")
    .insert({ zip, category, name, phone, problem, sms_consent: true, sms_consent_at: new Date().toISOString(), ip_hash: ipHash })
    .select("id,token").single();
  if (error || !row) return NextResponse.json({ error: "Could not start your request." }, { status: 500 });

  await dispatchWave(row.id, 1);
  return NextResponse.json({ token: row.token });
}
