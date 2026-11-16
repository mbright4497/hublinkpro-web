// Food trucks that are switched on right now. The database only returns a row while live_until
// is in the future and the owner's Channel is live, so nothing here can leak an off-duty truck.
import { SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase/env";

export type LiveTruck = {
  slug: string;
  name: string;
  tagline: string;
  city: string;
  logoUrl: string | null;
  lat: number;
  lng: number;
  note: string | null;
  liveUntil: string;
};

type Row = {
  lat: number; lng: number; note: string | null; live_until: string;
  channels: { slug: string; name: string; tagline: string | null; city: string | null; logo_url: string | null } |
    { slug: string; name: string; tagline: string | null; city: string | null; logo_url: string | null }[] | null;
};

export async function liveTrucks(): Promise<LiveTruck[]> {
  try {
    const now = new Date().toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/truck_locations?live_until=gt.${encodeURIComponent(now)}&select=lat,lng,note,live_until,channels!inner(slug,name,tagline,city,logo_url)&order=updated_at.desc`,
      { headers: { apikey: SUPABASE_KEY }, cache: "no-store", signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    return ((await res.json()) as Row[]).flatMap((r) => {
      const c = Array.isArray(r.channels) ? r.channels[0] : r.channels;
      if (!c) return [];
      return [{ slug: c.slug, name: c.name, tagline: c.tagline ?? "", city: c.city ?? "", logoUrl: c.logo_url,
        lat: r.lat, lng: r.lng, note: r.note, liveUntil: r.live_until }];
    });
  } catch {
    return [];
  }
}
