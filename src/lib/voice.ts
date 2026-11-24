// Voice-agent intake: turns an ElevenLabs post-call payload into the facts a Channel owner needs.
// Pure functions only (no database, no network) so they can be tested on their own.
import { createHmac, timingSafeEqual } from "node:crypto";

// ElevenLabs signs the raw body: header "ElevenLabs-Signature: t=<unix secs>,v0=<hex hmac-sha256 of `${t}.${body}`>".
// Rejects anything older (or newer) than the tolerance so a captured request can't be replayed later.
export function verifyElevenLabsSignature(rawBody: string, header: string | null, secret: string, nowSecs = Math.floor(Date.now() / 1000), toleranceSecs = 30 * 60): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => { const i = p.indexOf("="); return i < 0 ? [p.trim(), ""] : [p.slice(0, i).trim(), p.slice(i + 1).trim()]; }));
  const t = Number(parts.t);
  const sig = parts.v0;
  if (!Number.isFinite(t) || !sig) return false;
  if (Math.abs(nowSecs - t) > toleranceSecs) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {});
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

export type CallFacts = {
  conversationId: string;
  agentId: string;
  callerName: string; // "" when the agent never got one
  callbackNumber: string; // what the caller said, else the number they called from
  reason: string;
  urgent: boolean;
  summary: string;
  durationSecs: number;
  callerSpoke: boolean; // false when nobody said anything (hang-up, wrong number, robocall silence)
};

// Defensive on purpose: ElevenLabs documents the top-level shape but not every nested field, and
// "data collection" keys are whatever the agent owner named them. We match keys by meaning.
export function parseCall(payload: unknown): CallFacts | null {
  const p = obj(payload);
  if (p.type !== "post_call_transcription") return null;
  const d = obj(p.data);
  const conversationId = str(d.conversation_id);
  const agentId = str(d.agent_id);
  if (!conversationId || !agentId) return null;

  const meta = obj(d.metadata);
  const phone = obj(meta.phone_call);
  const analysis = obj(d.analysis);

  const collected: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj(analysis.data_collection_results))) {
    const val = typeof v === "object" && v !== null ? str(obj(v).value) : str(v);
    if (val && val.toLowerCase() !== "null" && val.toLowerCase() !== "unknown") collected[k.toLowerCase()] = val;
  }
  const pick = (re: RegExp) => Object.entries(collected).find(([k]) => re.test(k))?.[1] ?? "";

  const callbackNumber = pick(/call.?back|phone|number/) || str(phone.external_number) || str(phone.from_number);
  const urgentRaw = pick(/urgen|emergen|priority/).toLowerCase();
  const turns = Array.isArray(d.transcript) ? d.transcript.map(obj) : [];

  return {
    conversationId,
    agentId,
    callerName: pick(/name/),
    callbackNumber,
    reason: pick(/reason|about|purpose|service|message/),
    urgent: /^(true|yes|urgent|high|emergency)/.test(urgentRaw),
    summary: str(analysis.transcript_summary),
    durationSecs: Number(meta.call_duration_secs) || 0,
    callerSpoke: turns.some((t) => t.role === "user" && str(t.message).length > 0),
  };
}
