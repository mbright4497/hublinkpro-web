import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, ownerEmail } from "@/lib/notify";
import { renderEmail } from "@/lib/email-template";
import { SITE_URL } from "@/lib/site";
import { phoneKey, fmtPhone } from "@/lib/crm";
import { parseCall, verifyElevenLabsSignature } from "@/lib/voice";

export const dynamic = "force-dynamic";

// ElevenLabs calls this when a voice-agent call ends and its analysis is done.
// Nothing happens unless VOICE_AGENT_ENABLED=true. The signature is always checked first.
// Always answers 200 for a valid request we choose not to act on, so ElevenLabs doesn't retry or disable the webhook.
const clip = (s: string, n: number) => s.trim().slice(0, n);
// One short line per outcome, so Vercel logs show why a call did or didn't become a lead.
const skip = (why: string, extra?: unknown) => { console.log("[HLP-VOICE] skipped:", why, extra ?? ""); return NextResponse.json({ ignored: why }); };

export async function POST(req: Request) {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "ELEVENLABS_WEBHOOK_SECRET is not set" }, { status: 503 });
  const raw = await req.text();
  if (!verifyElevenLabsSignature(raw, req.headers.get("elevenlabs-signature"), secret)) { console.warn("[HLP-VOICE] rejected: bad or missing signature"); return NextResponse.json({ error: "bad signature" }, { status: 401 }); }
  if (process.env.VOICE_AGENT_ENABLED !== "true") return skip("voice agent is off");

  let body: unknown;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const call = parseCall(body);
  if (!call) return skip("not a call transcript", (body as { type?: string } | null)?.type);

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 503 });

  const { data: map } = await db.from("channel_voice_agents").select("channel_id").eq("agent_id", call.agentId).maybeSingle();
  if (!map) return skip("agent is not attached to a Channel", call.agentId);
  const { data: ch } = await db.from("channels").select("id,name,owner_id").eq("id", map.channel_id).maybeSingle();
  if (!ch) return skip("channel not found", map.channel_id);

  // ElevenLabs retries failed deliveries, so one call must only ever produce one email.
  const label = `Voice call summary (${call.conversationId})`;
  const { data: seen } = await db.from("message_log").select("id").eq("channel_id", ch.id).eq("label", label).limit(1);
  if (seen?.length) return skip("already handled", call.conversationId);

  // Silence (hang-up, wrong number) isn't a lead and isn't worth an email.
  if (!call.callerSpoke) return skip("caller said nothing", call.conversationId);

  const key = phoneKey(call.callbackNumber);
  const name = clip(call.callerName, 120) || "Phone caller";
  const note = [call.urgent ? "URGENT. " : "", call.summary || call.reason || "Left a message with the voice assistant.", ` (voice call ${call.conversationId})`].join("");

  // Same number = same person: add to the lead they already have instead of making a second one.
  let leadId: number | null = null;
  if (key) {
    const { data: existing } = await db.from("leads").select("id").eq("channel_id", ch.id).eq("phone_key", key).maybeSingle();
    leadId = existing?.id ?? null;
  }
  if (leadId) {
    await db.from("leads").update({ last_activity_at: new Date().toISOString() }).eq("id", leadId);
  } else {
    const phone = call.callbackNumber.replace(/[^\d+]/g, "");
    const { data: lead, error } = await db
      .from("leads")
      .insert({ channel_id: ch.id, name, phone: key ? clip(phone, 30) : null, phone_key: key, service: clip(call.reason, 120) || null, source: "call" })
      .select("id")
      .single();
    if (error || !lead) { console.error("[HLP-VOICE] lead insert failed:", error?.message); return NextResponse.json({ error: "lead save failed" }, { status: 500 }); }
    leadId = lead.id;
  }
  await db.from("lead_events").insert({ lead_id: leadId, channel_id: ch.id, kind: "note", body: clip(note, 2000) });

  const to = await ownerEmail(ch.owner_id);
  if (to) {
    const who = call.callerName || "A caller";
    const num = fmtPhone(call.callbackNumber);
    await sendEmail({
      to,
      subject: `${call.urgent ? "URGENT: " : ""}${who} called ${ch.name}${num ? ` (${num})` : ""}`,
      ...renderEmail({
        preheader: call.summary || call.reason,
        heading: call.urgent ? "Urgent call while you were out" : "You missed a call",
        paragraphs: [call.summary || "They left a message with your voice assistant."],
        bullets: [
          `Name: ${call.callerName || "not given"}`,
          `Call back: ${num || "not given"}`,
          ...(call.reason ? [`About: ${call.reason}`] : []),
          ...(call.durationSecs ? [`Length: ${Math.max(1, Math.round(call.durationSecs / 60))} min`] : []),
        ],
        button: { label: "Open this lead", url: `${SITE_URL}/dashboard/crm/${leadId}` },
        signoff: false,
      }),
      log: { channelId: ch.id, label },
    });
  } else {
    console.warn("[HLP-VOICE] no owner email for channel", ch.id);
  }
  console.log("[HLP-VOICE] handled", call.conversationId, "lead", leadId);
  return NextResponse.json({ ok: true, leadId });
}
