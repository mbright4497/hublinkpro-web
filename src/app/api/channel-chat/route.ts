import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isPaidTier } from "@/lib/accent";
import { CHAT_MODEL, MAX_TURNS, MAX_CHARS, IP_PER_HOUR, CHANNEL_PER_DAY, chatEnabled, ipHash, systemPrompt } from "@/lib/chat";

export const dynamic = "force-dynamic";

// Best-effort fallback limiter when the service key is not set (per server instance).
const mem = new Map<string, number[]>();
function memLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const hits = (mem.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  mem.set(key, hits);
  return hits.length > max;
}

const SORRY = "Sorry, I can't answer right now. Please use Book a time on this page, or call the business.";

export async function POST(req: Request) {
  if (!chatEnabled()) return NextResponse.json({ error: "off" }, { status: 404 });
  let body: { slug?: unknown; messages?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad" }, { status: 400 }); }
  const slug = typeof body.slug === "string" ? body.slug.slice(0, 80) : "";
  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages = raw
    .filter((m): m is { role: string; content: string } => !!m && typeof m === "object" && (m as { role?: unknown }).role !== undefined && typeof (m as { content?: unknown }).content === "string")
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, MAX_CHARS) }));
  if (!slug || !messages.length || messages[messages.length - 1].role !== "user" || !messages[messages.length - 1].content.trim()) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  while (messages.length && messages[0].role !== "user") messages.shift();

  const supabase = await supabaseServer();
  const { data: c } = await supabase
    .from("channels")
    .select("id,name,city,tagline,description,services,zip_codes,phone,website,booking_enabled,is_food_truck,tier,status,networks(name)")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();
  if (!c || !isPaidTier(c.tier)) return NextResponse.json({ error: "off" }, { status: 404 });

  // Rate limits: per visitor per hour, and per Channel per day.
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const h = ipHash(ip);
  const admin = supabaseAdmin();
  if (admin) {
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const dayAgo = new Date(Date.now() - 86400_000).toISOString();
    const [a, b] = await Promise.all([
      admin.from("channel_chat_usage").select("id", { count: "exact", head: true }).eq("ip_hash", h).gte("created_at", hourAgo),
      admin.from("channel_chat_usage").select("id", { count: "exact", head: true }).eq("channel_id", c.id).gte("created_at", dayAgo),
    ]);
    if ((a.count ?? 0) >= IP_PER_HOUR || (b.count ?? 0) >= CHANNEL_PER_DAY) {
      return NextResponse.json({ reply: "That's a lot of questions! Please use Book a time on this page, or call the business." }, { status: 429 });
    }
    await admin.from("channel_chat_usage").insert({ channel_id: c.id, ip_hash: h });
  } else if (memLimited(`${h}`, IP_PER_HOUR, 3600_000) || memLimited(`c${c.id}`, CHANNEL_PER_DAY, 86400_000)) {
    return NextResponse.json({ reply: "That's a lot of questions! Please use Book a time on this page, or call the business." }, { status: 429 });
  }

  const { data: work } = await supabase.from("portfolio_items").select("title,caption").eq("channel_id", c.id).order("sort_order").order("id").limit(8);

  try {
    const base = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: 300,
        system: [{ type: "text", text: systemPrompt(c as never, (work ?? []) as never), cache_control: { type: "ephemeral" } }],
        messages,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error("[HLP-CHAT] anthropic error", res.status);
      return NextResponse.json({ reply: SORRY }, { status: 502 });
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const reply = (data.content ?? []).filter((p) => p.type === "text").map((p) => p.text ?? "").join("").replace(/\*\*|__|`/g, "").trim();
    return NextResponse.json({ reply: reply || SORRY });
  } catch (e) {
    console.error("[HLP-CHAT] error", String(e));
    return NextResponse.json({ reply: SORRY }, { status: 502 });
  }
}
