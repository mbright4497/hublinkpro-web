import { NextResponse } from "next/server";

// Intake → GHL. Never loses a lead silently: if the webhook env is unset we log it;
// if the webhook call fails we return 502 and log the full record for recovery.
export async function POST(req: Request) {
  let record: Record<string, unknown> = {};
  try {
    record = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  record.received_at = new Date().toISOString();

  const webhook = process.env.HLP_INTAKE_WEBHOOK_URL;
  if (!webhook) {
    console.log("[HLP-INTAKE] no webhook configured — record:", JSON.stringify(record));
    return NextResponse.json({ ok: true, queued: false });
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      console.error("[HLP-INTAKE] webhook failed", res.status, JSON.stringify(record));
      return NextResponse.json({ ok: false, error: "webhook failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, queued: true });
  } catch (err) {
    console.error("[HLP-INTAKE] webhook error", String(err), JSON.stringify(record));
    return NextResponse.json({ ok: false, error: "webhook error" }, { status: 502 });
  }
}
