import { optoutOk } from "@/lib/nudge";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const page = (body: string) =>
  new Response(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;max-width:480px;margin:60px auto;padding:0 20px;line-height:1.5">${body}</body>`, {
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" },
  });

// GET only shows a confirm button, so an email scanner opening the link can't unsubscribe anyone.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const u = q.get("u") ?? "", s = q.get("s") ?? "";
  if (!optoutOk(u, s)) return page("<p>This link isn't valid.</p>");
  return page(`<p>Stop the HubLinkPro reminder emails?</p><form method="post"><input type="hidden" name="u" value="${u}"><input type="hidden" name="s" value="${s}"><button style="padding:10px 18px;font-size:16px">Yes, stop them</button></form>`);
}

export async function POST(req: Request) {
  const f = await req.formData();
  const u = String(f.get("u") ?? ""), s = String(f.get("s") ?? "");
  if (!optoutOk(u, s)) return page("<p>This link isn't valid.</p>");
  const db = supabaseAdmin();
  if (!db) return page("<p>Something went wrong. Reply to any of our emails and we'll stop them by hand.</p>");
  await db.from("signup_nudges").upsert({ user_id: u, kind: "optout" }, { onConflict: "user_id,kind", ignoreDuplicates: true });
  return page("<p>Done. You won't get any more reminder emails from us.</p>");
}
