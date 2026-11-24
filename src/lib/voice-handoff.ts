import type { SupabaseClient } from "@supabase/supabase-js";

// When the owner doesn't answer, connect the caller to the Channel's ElevenLabs voice agent.
// ElevenLabs "register call" returns the TwiML that streams the call to the agent.
// Returns null (so the caller falls back to the normal missed-call flow) if anything is off.
export async function voiceAgentTwiml(db: SupabaseClient, channelId: number, from?: string, to?: string): Promise<string | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (process.env.VOICE_AGENT_ENABLED !== "true" || !key || !from || !to) return null;
  const { data: map } = await db.from("channel_voice_agents").select("agent_id").eq("channel_id", channelId).limit(1).maybeSingle();
  if (!map?.agent_id) return null;
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/convai/twilio/register-call", {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: map.agent_id, from_number: from, to_number: to, direction: "inbound" }),
      signal: AbortSignal.timeout(5000),
    });
    const body = await res.text();
    if (!res.ok || !body.includes("<Response")) {
      console.error("[HLP-VOICE] register-call failed", res.status, body.slice(0, 200));
      return null;
    }
    console.log("[HLP-VOICE] handed missed call to voice agent, channel", channelId);
    return body.replace(/^<\?xml[^>]*\?>\s*/, "").replace(/^<Response>|<\/Response>\s*$/g, "");
  } catch (e) {
    console.error("[HLP-VOICE] register-call error", (e as Error).message);
    return null;
  }
}
