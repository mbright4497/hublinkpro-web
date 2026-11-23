// Quick-start copy and the Channel strength checklist. No AI and no invented facts:
// every word of starter copy comes from what the owner typed (name, services, city).

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

export function parseServices(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map(clean)
    .filter(Boolean)
    .slice(0, 12);
}

export function starterCopy(input: { name: string; services: string[]; city: string }) {
  const name = clean(input.name);
  const city = clean(input.city);
  const first = input.services[0] ?? "";
  // Tagline: "Driveway paving in Johnson City" (max 120 characters, same as the form).
  const tagline = (first && city ? `${first} in ${city}` : first || (city ? `Serving ${city}` : "")).slice(0, 120) || null;
  const list =
    input.services.length === 0
      ? ""
      : input.services.length === 1
        ? input.services[0]
        : `${input.services.slice(0, -1).join(", ")} and ${input.services[input.services.length - 1]}`;
  const parts = [
    city ? `${name} serves ${city} and the neighbors around it.` : `${name} is a local business.`,
    list ? `What we do: ${list}.` : "",
    "Book a time or send a request right here and we will get back to you.",
  ].filter(Boolean);
  return { tagline, description: parts.join(" ").slice(0, 2000) };
}

type Ch = {
  logo_url: string | null;
  hero_image_url: string | null;
  tagline: string | null;
  description: string | null;
  services: string[] | null;
  phone: string | null;
  city: string | null;
  video_url: string | null;
  video_file_url: string | null;
  booking_enabled: boolean | null;
  booking_url: string | null;
  social_links: Record<string, string> | null;
};

export type StrengthItem = { key: string; label: string; tip: string; ok: boolean };

// Plain checklist computed from what is actually on the Channel. Each missing item carries one next step.
export function channelStrength(ch: Ch): { items: StrengthItem[]; pct: number; next: StrengthItem | null } {
  const items: StrengthItem[] = [
    { key: "hero", label: "Cover photo", tip: "Add a wide photo of your best work or your crew. It is the first thing neighbors see.", ok: !!ch.hero_image_url },
    { key: "logo", label: "Logo", tip: "Add a square logo or a clear photo so people recognize you.", ok: !!ch.logo_url },
    { key: "services", label: "Services listed", tip: "List what you do, separated by commas, so neighbors know you are the right pro.", ok: (ch.services?.length ?? 0) > 0 },
    { key: "tagline", label: "Tagline", tip: "Write one short line about what you do and where.", ok: !!ch.tagline?.trim() },
    { key: "description", label: "About you", tip: "Add a few sentences in your own words. Mention how long you have been at it.", ok: !!ch.description?.trim() },
    { key: "phone", label: "Phone number", tip: "Add the number you want neighbors to call.", ok: !!ch.phone },
    { key: "city", label: "City", tip: "Add your city so neighbors nearby find you.", ok: !!ch.city },
    { key: "booking", label: "Booking set up", tip: "Turn on booking so neighbors can pick a time without calling.", ok: !!ch.booking_enabled || !!ch.booking_url },
    { key: "video", label: "Short video", tip: "Record a 30 to 60 second video on your phone. Say who you are and what you do.", ok: !!ch.video_url || !!ch.video_file_url },
    { key: "facebook", label: "Facebook link", tip: "Add your Facebook page so neighbors can see your past work.", ok: !!ch.social_links?.facebook },
  ];
  const done = items.filter((i) => i.ok).length;
  return { items, pct: Math.round((done / items.length) * 100), next: items.find((i) => !i.ok) ?? null };
}
