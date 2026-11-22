import { NextResponse } from "next/server";
import { checkCode } from "@/lib/verify";

export const dynamic = "force-dynamic";

// Visitor types the 6-digit code we texted. Correct code releases their request to the pro.
export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "bad" }, { status: 400 }); }
  const r = await checkCode(String(b.token ?? ""), String(b.code ?? ""));
  return r.ok ? NextResponse.json({ ok: true, kind: r.kind }) : NextResponse.json({ error: r.error }, { status: r.status });
}
