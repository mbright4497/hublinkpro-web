// Shared helpers for Channel media: social links, reels, and upload paths.

export const BUCKET = "channel-media";

export const SOCIALS: { key: string; label: string; hosts: string[] | null }[] = [
  { key: "facebook", label: "Facebook", hosts: ["facebook.com", "fb.com", "fb.me", "fb.watch"] },
  { key: "instagram", label: "Instagram", hosts: ["instagram.com"] },
  { key: "tiktok", label: "TikTok", hosts: ["tiktok.com"] },
  { key: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  { key: "x", label: "X", hosts: ["x.com", "twitter.com"] },
  { key: "linkedin", label: "LinkedIn", hosts: ["linkedin.com"] },
  { key: "google", label: "Google Business", hosts: null },
];

const REEL_HOSTS = ["tiktok.com", "instagram.com", "facebook.com", "fb.watch", "fb.com", "youtube.com", "youtu.be", "vimeo.com"];

export function hostOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.replace(/^www\.|^m\.|^vm\.|^vt\./, "");
  } catch {
    return null;
  }
}

export function hostMatches(raw: string, hosts: string[] | null): boolean {
  if (!hosts) return true;
  const h = hostOf(raw);
  return !!h && hosts.some((x) => h === x || h.endsWith(`.${x}`));
}

export const isReelUrl = (raw: string) => hostMatches(raw, REEL_HOSTS);

export type Reel = { platform: string; href: string; embed: string | null; tall: boolean };

// Embeds use each platform's own public embed address. Short/odd links fall back to a plain link.
export function reel(href: string): Reel {
  try {
    const u = new URL(href);
    const h = hostOf(href) ?? "";
    const parts = u.pathname.split("/").filter(Boolean);

    if (h === "youtu.be" && parts[0])
      return { platform: "YouTube", href, embed: `https://www.youtube.com/embed/${parts[0]}`, tall: false };
    if (h.endsWith("youtube.com")) {
      if (parts[0] === "shorts" && parts[1])
        return { platform: "YouTube", href, embed: `https://www.youtube.com/embed/${parts[1]}`, tall: true };
      const v = u.searchParams.get("v");
      if (v) return { platform: "YouTube", href, embed: `https://www.youtube.com/embed/${v}`, tall: false };
    }
    if (h === "vimeo.com" && /^\d+$/.test(parts[0] ?? ""))
      return { platform: "Vimeo", href, embed: `https://player.vimeo.com/video/${parts[0]}`, tall: false };
    if (h.endsWith("tiktok.com")) {
      const i = parts.indexOf("video");
      if (i >= 0 && /^\d+$/.test(parts[i + 1] ?? ""))
        return { platform: "TikTok", href, embed: `https://www.tiktok.com/embed/v2/${parts[i + 1]}`, tall: true };
      return { platform: "TikTok", href, embed: null, tall: true };
    }
    if (h.endsWith("instagram.com")) {
      const i = parts.findIndex((p) => ["reel", "reels", "p", "tv"].includes(p));
      if (i >= 0 && parts[i + 1]) {
        const kind = parts[i] === "reels" ? "reel" : parts[i];
        return { platform: "Instagram", href, embed: `https://www.instagram.com/${kind}/${parts[i + 1]}/embed`, tall: true };
      }
      return { platform: "Instagram", href, embed: null, tall: true };
    }
    if (h.endsWith("facebook.com") || h === "fb.watch" || h === "fb.com")
      return {
        platform: "Facebook",
        href,
        embed: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(href)}&show_text=false`,
        tall: false,
      };
  } catch {}
  return { platform: "Video", href, embed: null, tall: false };
}
