// HubLinkPro data layer.
// Geography-agnostic by design: location lives in the data, never hardcoded in components.
// RULE: only real businesses with real, verifiable information go in BUSINESSES. No placeholder
// listings, invented ratings/reviews/job counts, or sample phone numbers or domains — ever.
// (FTC fake-review rule; also see the note on PitchBlock below.) Swap for Supabase later.

export type Network = {
  id: string;
  name: string;
  slug: string;
  count: number; // number of services in this network
  hue: string; // gradient for the network tile
  icon: string;
};

// Channel tiers — the monetization ladder.
//  free     = basic listing: photo + link to their site (offered to everyone, land-grab)
//  pro      = Verified Pro ($39/mo): adds commercial reel + richer profile
//  favorite = Neighborhood Favorite (exclusive, 1 per category per ZIP, $199-499/mo):
//             marquee placement + full channel (gallery, services, reviews) + hyperlocal reach
export type Tier = "free" | "pro" | "favorite";

export type Review = { author: string; stars: number; text: string };
export type GalleryItem = { label: string; art: string };

// A "why choose us" block. Used on Channels where showcased reviews either don't exist yet
// or would have to be invented — notably HubLinkPro's own house Channel. Never fabricate a
// review for a real company: the FTC fake-review rule carries a per-violation penalty.
export type PitchBlock = { ic: string; h: string; p: string };

export type Business = {
  id: number;
  slug: string;
  name: string;
  category: string;
  networkId: string;
  tier: Tier;
  website?: string; // free tier links out to their own site
  phone?: string;
  hours?: string;
  services?: string[]; // services the Channel offers (Pro+ show these)
  gallery?: GalleryItem[]; // "Our Work" photo placeholders (full Channel)
  reviewsList?: Review[]; // showcased reviews (full Channel)
  pitch?: PitchBlock[]; // "why pros choose us" — shown where reviews are absent by design
  // HOUSE CHANNEL — HubLinkPro's own listing. It is the live demo of the product, not a
  // local pro. Excluded from every "pros near you" row so it never competes with a paying
  // business for a slot, and rendered with business-owner CTAs instead of homeowner ones.
  house?: boolean;
  logo: string; // emoji placeholder until real logo
  art: string; // css class for the styled poster placeholder
  rating: number;
  reviews: number;
  years: number;
  jobs: number; // 0 for food/dining (no "jobs" metric)
  tagline: string;
  neighborhood: string;
  verified: boolean;
  emergency: boolean;
  openNow: boolean;
  foodTruck: boolean;
  // Set for Channels that come from the database. Static entries leave these unset.
  href?: string; // where the poster links (defaults to /business/<slug>)
  imgUrl?: string; // real hero image
  logoUrl?: string; // real logo
};

export const NETWORKS: Network[] = [
  { id: "home", name: "Home Services", slug: "home-services", count: 20, icon: "🏠", hue: "linear-gradient(135deg,#7a5a12,#3f2c06)" },
  { id: "construction", name: "Construction & Trades", slug: "construction-trades", count: 11, icon: "🔨", hue: "linear-gradient(135deg,#7a4a12,#3f2706)" },
  { id: "food", name: "Food & Dining", slug: "food-dining", count: 8, icon: "🍽️", hue: "linear-gradient(135deg,#7a3a1a,#3f1f0c)" },
  { id: "medical", name: "Medical & Wellness", slug: "medical-wellness", count: 9, icon: "➕", hue: "linear-gradient(135deg,#7a2f2a,#3f1818)" },
  { id: "beauty", name: "Beauty & Fitness", slug: "beauty-fitness", count: 8, icon: "✂️", hue: "linear-gradient(135deg,#7a3320,#3f1a10)" },
  { id: "auto", name: "Auto & Transport", slug: "auto-transport", count: 8, icon: "🚗", hue: "linear-gradient(135deg,#6f4527,#3a2413)" },
  { id: "financial", name: "Financial & Insurance", slug: "financial-insurance", count: 6, icon: "$", hue: "linear-gradient(135deg,#6a4a1e,#38270f)" },
  { id: "legal", name: "Legal & Professional", slug: "legal-professional", count: 5, icon: "⚖️", hue: "linear-gradient(135deg,#734024,#3a2012)" },
  { id: "realestate", name: "Real Estate", slug: "real-estate", count: 6, icon: "🔑", hue: "linear-gradient(135deg,#75381f,#3a1c10)" },
  { id: "family", name: "Family, Pets & Education", slug: "family-pets-education", count: 7, icon: "🐾", hue: "linear-gradient(135deg,#743a28,#3a1d14)" },
  { id: "events", name: "Events & Entertainment", slug: "events-entertainment", count: 6, icon: "✨", hue: "linear-gradient(135deg,#78341c,#3c1a0e)" },
  { id: "tech", name: "Tech & Business", slug: "tech-business", count: 6, icon: "💻", hue: "linear-gradient(135deg,#6d3a2a,#371d15)" },
];

export const BUSINESSES: Business[] = [
  // ── HOUSE CHANNEL ────────────────────────────────────────────────────────────
  // HubLinkPro's own Channel. This is how we advertise for ourselves: instead of a
  // pitch page, a business owner sees the actual finished product they'd be buying.
  // Built at the Neighborhood Favorite tier so every premium surface renders.
  // DELIBERATELY has no reviewsList and rating/reviews/years = 0 — nothing on this
  // page is invented. Fill in real numbers only when they're real. `pitch` carries
  // the persuasion instead.
  {
    id: 17,
    slug: "hublinkpro",
    name: "HubLinkPro",
    category: "Local Marketing & Lead Generation",
    networkId: "tech",
    tier: "favorite",
    house: true,
    website: "https://hublinkpro.com",
    // Matt's direct line for now — NOT 8455. 8455 is published across the paving funnel as
    // Reliable Paving's number and is the A2P sending identity; reusing it here would muddy
    // the co-branded consent story. Swap to a dedicated HLP number when there is one.
    phone: "(423) 737-4331",
    hours: "Platform live 24/7 · We answer Mon–Fri, 9:00 AM – 5:00 PM ET",
    services: [
      "Free business listing",
      "Verified Pro profile",
      "Neighborhood Favorite — exclusive ZIP slot",
      "Speed-to-lead AI follow-up",
      "Review engine",
      "Missed-call text-back",
      "Commercial reel on your Channel",
    ],
    gallery: [
      { label: "Your Channel — your own branded space", art: "a-hlp" },
      { label: "Discovery rows neighbors actually browse", art: "a-generic" },
      { label: "Neighborhood radar — live in your ZIP", art: "a-hlp" },
      { label: "Exclusive slots, one per category per ZIP", art: "a-generic" },
    ],
    pitch: [
      {
        ic: "🔒",
        h: "One slot — not one lead sold seven times",
        p: "We don't auction the same inquiry to every contractor in the county. A Neighborhood Favorite slot is exclusive: one business, one category, one ZIP. The slot you take is the slot your competitor can't.",
      },
      {
        ic: "⚡",
        h: "Fast follow-up, built in",
        p: "Speed-to-lead follow-up and missed-call text-back are rolling out to founding members first.",
      },
      {
        ic: "📡",
        h: "Hyperlocal by design",
        p: "You buy the ZIPs you actually serve. No paying for reach three counties away, no bidding against national money for clicks in your own town.",
      },
      {
        ic: "🎬",
        h: "A Channel, not a directory row",
        p: "Commercial reel, work gallery, services, hours — your own space, built to be browsed like a streaming app instead of skimmed like a phone book.",
      },
    ],
    logo: "🅷",
    art: "a-hlp",
    rating: 0,
    reviews: 0,
    years: 0,
    jobs: 0,
    tagline: "The local discovery platform your neighbors actually open — and the growth engine behind every pro listed on it.",
    neighborhood: "Tri-Cities",
    verified: false,
    emergency: false,
    openNow: false,
    foodTruck: false,
  },
];

export function getBusiness(slug: string): Business | undefined {
  return BUSINESSES.find((b) => b.slug === slug);
}

export function getNetwork(id: string): Network | undefined {
  return NETWORKS.find((s) => s.id === id);
}

export function getNetworkBySlug(slug: string): Network | undefined {
  return NETWORKS.find((n) => n.slug === slug);
}

// Distinct Categories present within a Network (derived from Channels for now).
export function categoriesInNetwork(networkId: string): string[] {
  return Array.from(new Set(BUSINESSES.filter((b) => b.networkId === networkId).map((b) => b.category))).sort();
}

export function tierLabel(tier: Tier): string {
  return tier === "favorite" ? "Neighborhood Favorite" : tier === "pro" ? "Verified Pro" : "Free Listing";
}

// HubLinkPro's own house Channel — the self-advertisement. Never a row candidate.
export function houseChannel(): Business | undefined {
  return BUSINESSES.find((b) => b.house);
}

// Every real listed business, house Channel excluded. All discovery rows read from this,
// so HubLinkPro can never take a slot away from a business that's paying for one.
const LOCAL = () => BUSINESSES.filter((b) => !b.house);

// Row selectors (geography-agnostic; later these become PROPHET-scored / location-aware queries)
export const rowAvailableNow = () => LOCAL().filter((b) => b.openNow && !b.foodTruck).slice(0, 8);
export const rowEmergency = () => LOCAL().filter((b) => b.emergency);
export const rowTopRated = () => [...LOCAL()].filter((b) => !b.foodTruck).sort((a, b) => b.rating - a.rating).slice(0, 8);
export const rowFoodTrucks = () => LOCAL().filter((b) => b.foodTruck);
export const rowByNetwork = (networkId: string) => LOCAL().filter((b) => b.networkId === networkId);

// The flagship pro we feature in the hero/spotlight. Chosen from the DATA — highest-rated
// premium local Channel — never a hardcoded slug. Whoever earns the top slot gets it.
export function flagshipChannel(): Business | undefined {
  const ranked = [...LOCAL()]
    .filter((b) => !b.foodTruck)
    .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  return ranked.find((b) => b.tier === "favorite") ?? ranked.find((b) => b.tier === "pro") ?? ranked[0];
}
export const spotlight = () => flagshipChannel();

// FOOD FRONT DOOR — food is the daily-habit surface that pulls people in.
export const rowFood = () => LOCAL().filter((b) => b.networkId === "food");

// Deterministic "food pick of the day" — rotates daily so there's a fresh reason to open the app.
export function foodPickOfDay(): Business | undefined {
  const food = rowFood();
  if (food.length === 0) return undefined;
  const day = Math.floor(Date.now() / 86_400_000); // days since epoch
  return food[day % food.length];
}
