// Live Channels from the database -> the Business shape the browse rows already render.
// Reads only status='live' rows (also enforced by RLS). Plain REST fetch with a 60s revalidate,
// so the homepage and Network pages stay cacheable instead of going fully dynamic.
// Nothing here invents data: no ratings, review counts, years or jobs. Those stay 0 and the
// poster hides them.
import { SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase/env";
import { NETWORKS, type Business, type Tier } from "@/lib/data";
import { youtubeVideoEmbed } from "@/lib/youtube";

type Row = {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  city: string | null;
  is_food_truck: boolean | null;
  tier: string | null;
  networks: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

const HOUSE_SLUG = "hublinkpro";

function toBusiness(r: Row): Business {
  const net = Array.isArray(r.networks) ? r.networks[0] : r.networks;
  const network = NETWORKS.find((n) => n.slug === net?.slug);
  const tier: Tier = r.tier === "pro" || r.tier === "favorite" ? r.tier : "free";
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: net?.name ?? "Local business",
    networkId: network?.id ?? "",
    tier,
    logo: network?.icon ?? "🏠",
    art: "a-generic",
    rating: 0,
    reviews: 0,
    years: 0,
    jobs: 0,
    tagline: r.tagline ?? "",
    neighborhood: r.city ?? "",
    verified: false,
    emergency: false,
    openNow: false,
    foodTruck: !!r.is_food_truck,
    house: r.slug === HOUSE_SLUG,
    href: `/channel/${r.slug}`,
    imgUrl: r.hero_image_url ?? undefined,
    logoUrl: r.logo_url ?? undefined,
  };
}

// Newest first. Returns [] on any failure so the homepage degrades to its empty states.
export async function liveChannels(marketSlug?: string): Promise<Business[]> {
  try {
    // With a market, an inner join on markets keeps only that market's Channels.
    const filter = marketSlug && /^[a-z0-9-]{2,40}$/.test(marketSlug) ? `&markets.slug=eq.${marketSlug}` : "";
    const join = filter ? ",markets!inner(slug)" : "";
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/channels?status=eq.live&select=id,slug,name,tagline,logo_url,hero_image_url,city,is_food_truck,tier,networks(slug,name)${join}&order=created_at.desc${filter}`,
      { headers: { apikey: SUPABASE_KEY }, next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    return ((await res.json()) as Row[]).map(toBusiness);
  } catch {
    return [];
  }
}

// Local pros only. The house Channel is the product demo and never takes a row slot.
export async function localChannels(marketSlug?: string): Promise<Business[]> {
  return (await liveChannels(marketSlug)).filter((b) => !b.house);
}

export async function liveHouseChannel(): Promise<Business | undefined> {
  return (await liveChannels()).find((b) => b.house);
}

// What the homepage "live Channel" stage needs from the house Channel.
export type HouseStage = {
  slug: string;
  name: string;
  tagline: string;
  videoFile: string | null;
  videoEmbed: string | null;
  poster: string | null;
};

export async function houseStage(): Promise<HouseStage | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/channels?status=eq.live&slug=eq.${HOUSE_SLUG}&select=slug,name,tagline,video_file_url,video_url,hero_image_url&limit=1`,
      { headers: { apikey: SUPABASE_KEY }, next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const [c] = (await res.json()) as {
      slug: string; name: string; tagline: string | null;
      video_file_url: string | null; video_url: string | null; hero_image_url: string | null;
    }[];
    if (!c) return null;
    return {
      slug: c.slug,
      name: c.name,
      tagline: c.tagline ?? "",
      videoFile: c.video_file_url,
      videoEmbed: c.video_file_url ? null : (youtubeVideoEmbed(c.video_url)?.embed ?? null),
      poster: c.hero_image_url,
    };
  } catch {
    return null;
  }
}
