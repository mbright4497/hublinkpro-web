import { NextResponse } from "next/server";
import { resendCode } from "@/lib/verify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "bad" }, { status: 400 }); }
  const r = await resendCode(String(b.token ?? ""));
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: r.status });
}
