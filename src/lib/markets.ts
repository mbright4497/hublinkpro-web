// Markets: the metro areas HubLinkPro runs in. Everything regional on the site (headline area,
// neighborhood cards, ZIP list, Channels shown) comes from one of these rows, so opening a new
// area is a database row plus businesses, not a code change.
import { SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase/env";

export type Market = {
  id: number;
  slug: string;
  name: string; // "Tri-Cities"
  place: string; // "the Tri-Cities", reads right after "in"
  region_label: string; // "Johnson City · Kingsport · Tri-Cities"
  state: string;
  center_lat: number;
  center_lng: number;
  radius_miles: number;
  featured_zips: string[];
  launched: boolean;
};

export const DEFAULT_MARKET_SLUG = "tri-cities";
export const MARKET_COOKIE = "hlp_market";
export const isMarketSlug = (s: string | undefined | null): s is string => !!s && /^[a-z0-9-]{2,40}$/.test(s);

const COLS = "id,slug,name,place,region_label,state,center_lat,center_lng,radius_miles,featured_zips,launched";

// Used only if the database can't be reached, so the flagship homepage never goes blank.
export const FALLBACK_MARKET: Market = {
  id: 1, slug: DEFAULT_MARKET_SLUG, name: "Tri-Cities", place: "the Tri-Cities",
  region_label: "Johnson City · Kingsport · Tri-Cities", state: "TN",
  center_lat: 36.45, center_lng: -82.4, radius_miles: 45, launched: true,
  featured_zips: ["37601 · Johnson City", "37604 · Johnson City", "37615 · Johnson City", "37660 · Kingsport", "37663 · Kingsport", "37664 · Kingsport"],
};

export async function getMarkets(): Promise<Market[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/markets?select=${COLS}&order=display_order,name`, {
      headers: { apikey: SUPABASE_KEY },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    return ((await res.json()) as Market[]).map((m) => ({
      ...m,
      center_lat: Number(m.center_lat),
      center_lng: Number(m.center_lng),
    }));
  } catch {
    return [];
  }
}

export async function getMarket(slug: string): Promise<Market | undefined> {
  return (await getMarkets()).find((m) => m.slug === slug);
}

export async function getDefaultMarket(): Promise<Market> {
  const all = await getMarkets();
  return all.find((m) => m.slug === DEFAULT_MARKET_SLUG) ?? all.find((m) => m.launched) ?? FALLBACK_MARKET;
}

export function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 3958.8; // miles
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// The launched market whose service radius contains this point; nearest wins. Undefined = none close enough.
export function marketForPoint(markets: Market[], lat: number, lng: number): Market | undefined {
  let best: { m: Market; d: number } | undefined;
  for (const m of markets) {
    if (!m.launched) continue;
    const d = milesBetween(lat, lng, m.center_lat, m.center_lng);
    if (d <= m.radius_miles && (!best || d < best.d)) best = { m, d };
  }
  return best?.m;
}
