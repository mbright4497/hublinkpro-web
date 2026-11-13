// YouTube helpers: turn whatever link a business pastes into something we can show on their Channel.

const YT_HOSTS = ["youtube.com", "youtu.be"];
const ID = /^[A-Za-z0-9_-]{6,20}$/;

function parse(raw: string | null | undefined): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const h = u.hostname.replace(/^www\.|^m\./, "");
    return YT_HOSTS.includes(h) ? u : null;
  } catch {
    return null;
  }
}

// A single video (watch, youtu.be, shorts, live, embed) → embed URL, else null.
export function youtubeVideoEmbed(raw: string | null | undefined): { embed: string; tall: boolean } | null {
  const u = parse(raw);
  if (!u) return null;
  const h = u.hostname.replace(/^www\.|^m\./, "");
  const parts = u.pathname.split("/").filter(Boolean);
  let id: string | null = null;
  let tall = false;
  if (h === "youtu.be") id = parts[0] ?? null;
  else if (parts[0] === "watch") id = u.searchParams.get("v");
  else if (parts[0] === "shorts") {
    id = parts[1] ?? null;
    tall = true;
  } else if (parts[0] === "live" || parts[0] === "embed") id = parts[1] ?? null;
  return id && ID.test(id) ? { embed: `https://www.youtube.com/embed/${id}`, tall } : null;
}

// A channel link (@handle, /channel/UC…, /c/name, /user/name) → the channel's uploads playlist embed.
// The newest upload plays first. Returns null if the ID can't be found (caller falls back to a link).
export async function youtubeChannelEmbed(raw: string | null | undefined): Promise<string | null> {
  const u = parse(raw);
  if (!u || youtubeVideoEmbed(raw)) return null;
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  let channelId: string | null = null;
  if (parts[0] === "channel" && /^UC[A-Za-z0-9_-]{22}$/.test(parts[1] ?? "")) channelId = parts[1];
  else if (parts[0].startsWith("@") || ["c", "user"].includes(parts[0])) {
    try {
      const path = parts[0].startsWith("@") ? `/${parts[0]}` : `/${parts[0]}/${parts[1] ?? ""}`;
      const res = await fetch(`https://www.youtube.com${path}`, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; HubLinkPro/1.0)", "accept-language": "en-US,en;q=0.9" },
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const html = await res.text();
        channelId =
          html.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/)?.[1] ??
          html.match(/"channelId":"(UC[A-Za-z0-9_-]{22})"/)?.[1] ??
          html.match(/youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})/)?.[1] ??
          null;
      }
    } catch {}
  }
  return channelId ? `https://www.youtube.com/embed/videoseries?list=UU${channelId.slice(2)}` : null;
}

// Facebook Page Plugin: a small live feed of a public Page's posts. Works for Pages only
// (not personal profiles), so the Channel page always shows an "Open on Facebook" link beside it.
export function facebookFeedEmbed(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (!/(^|\.)facebook\.com$/i.test(u.hostname)) return null;
    // Skip links that are not a Page (profile ids, share links, groups, posts).
    if (/^\/(profile\.php|share|groups|permalink|story\.php|watch|reel)/i.test(u.pathname)) return null;
    if (u.pathname.replace(/\//g, "") === "") return null;
    const href = `https://www.facebook.com${u.pathname.replace(/\/$/, "")}`;
    return `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(href)}&tabs=timeline&width=340&height=520&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false`;
  } catch {
    return null;
  }
}
