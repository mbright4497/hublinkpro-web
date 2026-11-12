// Live Channels from the database -> the Business shape the browse rows already render.
// Reads only status='live' rows (also enforced by RLS). Plain REST fetch with a 60s revalidate,
// so the homepage and Network pages stay cacheable instead of going fully dynamic.
// Nothing here invents data: no ratings, review counts, years or jobs. Those stay 0 and the
// poster hides them.
import { SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase/env";
import { NETWORKS, type Business, type Tier } from "@/lib/data";

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
export async function liveChannels(): Promise<Business[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/channels?status=eq.live&select=id,slug,name,tagline,logo_url,hero_image_url,city,is_food_truck,tier,networks(slug,name)&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY }, next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    return ((await res.json()) as Row[]).map(toBusiness);
  } catch {
    return [];
  }
}

// Local pros only. The house Channel is the product demo and never takes a row slot.
export async function localChannels(): Promise<Business[]> {
  return (await liveChannels()).filter((b) => !b.house);
}

export async function liveHouseChannel(): Promise<Business | undefined> {
  return (await liveChannels()).find((b) => b.house);
}
