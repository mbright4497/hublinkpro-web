// HubLinkPro data layer.
// Geography-agnostic by design: location lives in the data, never hardcoded in components.
// This is demo/seed data for the Tri-Cities launch — swap for Supabase-backed queries later.

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
  {
    id: 1,
    slug: "reliable-paving",
    name: "Reliable Paving",
    category: "Paving & Asphalt",
    networkId: "construction",
    tier: "favorite",
    website: "https://reliablepaving.com",
    phone: "(423) 430-8455",
    hours: "Mon–Sat · 7:00 AM – 7:00 PM",
    services: [
      "New asphalt driveways",
      "Sealcoating & striping",
      "Resurfacing & repair",
      "Commercial lots & parking",
      "Crack filling & patching",
    ],
    gallery: [
      { label: "New driveway install", art: "a-pave" },
      { label: "Sealcoated & striped lot", art: "a-generic" },
      { label: "Resurfaced driveway", art: "a-pave" },
      { label: "Commercial parking lot", art: "a-auto" },
    ],
    reviewsList: [
      { author: "Sarah M.", stars: 5, text: "Joe's crew repaved our driveway in a single day — clean, on time, and it looks incredible. Best crew in the Tri-Cities." },
      { author: "Dale W.", stars: 5, text: "Honest quote, no surprises, no pressure. They sealed and striped our lot and it looks brand new." },
      { author: "Priya R.", stars: 5, text: "Showed up when they said, did exactly what they promised. Would hire Reliable again in a heartbeat." },
    ],
    logo: "🛣️",
    art: "a-pave",
    rating: 4.9,
    reviews: 127,
    years: 18,
    jobs: 340,
    tagline: "Driveways, sealcoating & lots done right the first time — the crew your neighbors already trust.",
    neighborhood: "Johnson City",
    verified: true,
    emergency: false,
    openNow: true,
    foodTruck: false,
  },
  { id: 2, slug: "summit-hvac", name: "Summit HVAC", category: "Heating & Cooling", networkId: "home", tier: "pro", website: "https://summithvac.com", phone: "(423) 555-0142", services: ["AC repair & install", "Furnace service", "24/7 emergency", "Maintenance plans"], logo: "❄️", art: "a-hvac", rating: 4.8, reviews: 203, years: 12, jobs: 512, tagline: "Same-day repair, honest quotes, 24/7 emergency line.", neighborhood: "Johnson City", verified: true, emergency: true, openNow: true, foodTruck: false },
  { id: 3, slug: "ridgeline-roofing", name: "Ridgeline Roofing", category: "Roofing", networkId: "construction", tier: "pro", website: "https://ridgelineroofing.com", phone: "(423) 555-0177", services: ["Full replacements", "Storm damage repair", "Free inspections", "Gutter work"], logo: "🏘️", art: "a-roof", rating: 4.9, reviews: 98, years: 15, jobs: 276, tagline: "Storm damage & full replacements. Free inspection this week.", neighborhood: "Kingsport", verified: true, emergency: true, openNow: true, foodTruck: false },
  { id: 4, slug: "mountain-home-plumbing", name: "Mountain Home Plumbing", category: "Plumbing", networkId: "home", tier: "free", website: "https://mountainhomeplumbing.com", logo: "🔧", art: "a-plumb", rating: 4.7, reviews: 154, years: 9, jobs: 390, tagline: "Leaks, water heaters, repipes — fast and clean.", neighborhood: "Johnson City", verified: true, emergency: true, openNow: true, foodTruck: false },
  { id: 5, slug: "tri-cities-electric", name: "Tri-Cities Electric", category: "Electrical", networkId: "home", tier: "free", website: "https://tricitieselectric.com", logo: "⚡", art: "a-elec", rating: 4.8, reviews: 176, years: 14, jobs: 441, tagline: "Panels, EV chargers, whole-home wiring.", neighborhood: "Bristol", verified: true, emergency: true, openNow: false, foodTruck: false },
  { id: 6, slug: "blue-ridge-clean", name: "Blue Ridge Clean Co.", category: "House Cleaning", networkId: "home", tier: "free", website: "https://blueridgeclean.com", logo: "🧽", art: "a-clean", rating: 4.9, reviews: 88, years: 6, jobs: 610, tagline: "Recurring & deep cleans, bonded and insured team.", neighborhood: "Johnson City", verified: true, emergency: false, openNow: true, foodTruck: false },
  { id: 7, slug: "evergreen-lawn-land", name: "Evergreen Lawn & Land", category: "Landscaping", networkId: "home", tier: "pro", website: "https://evergreenlawnland.com", phone: "(423) 555-0198", services: ["Mowing & maintenance", "Landscape design", "Hardscape & patios", "Seasonal cleanup"], logo: "🌿", art: "a-land", rating: 4.8, reviews: 112, years: 11, jobs: 503, tagline: "Design, mowing, hardscape & seasonal cleanup.", neighborhood: "Kingsport", verified: true, emergency: false, openNow: true, foodTruck: false },
  { id: 8, slug: "johnson-city-family-dental", name: "Johnson City Family Dental", category: "Dentist", networkId: "medical", tier: "free", website: "https://jcfamilydental.com", logo: "🦷", art: "a-dent", rating: 4.9, reviews: 264, years: 20, jobs: 0, tagline: "New-patient exams open this week. Gentle, modern care.", neighborhood: "Johnson City", verified: true, emergency: false, openNow: true, foodTruck: false },
  { id: 9, slug: "kingsport-collision", name: "Kingsport Collision", category: "Auto Body & Collision", networkId: "auto", tier: "free", website: "https://kingsportcollision.com", logo: "🚗", art: "a-auto", rating: 4.7, reviews: 141, years: 16, jobs: 388, tagline: "Insurance-approved. Free estimates, lifetime warranty.", neighborhood: "Kingsport", verified: true, emergency: false, openNow: true, foodTruck: false },
  { id: 10, slug: "smoky-mountain-bbq-truck", name: "Smoky Mountain BBQ Truck", category: "Food Truck · BBQ", networkId: "food", tier: "favorite", website: "https://smokymtnbbq.com", phone: "(423) 555-0110", services: ["Brisket & pulled pork", "Catering & events", "Daily specials"], logo: "🍖", art: "a-bbq", rating: 4.9, reviews: 321, years: 5, jobs: 0, tagline: "📍 Founders Park till 8pm today. Brisket while it lasts.", neighborhood: "Johnson City", verified: true, emergency: false, openNow: true, foodTruck: true },
  { id: 11, slug: "taco-loco", name: "Taco Loco", category: "Food Truck · Mexican", networkId: "food", tier: "pro", website: "https://tacoloco.com", logo: "🌮", art: "a-taco", rating: 4.8, reviews: 198, years: 3, jobs: 0, tagline: "📍 Downtown JC · lunch service on now.", neighborhood: "Johnson City", verified: true, emergency: false, openNow: true, foodTruck: true },
  { id: 12, slug: "highland-coffee-cart", name: "Highland Coffee Cart", category: "Food Truck · Coffee", networkId: "food", tier: "free", website: "https://highlandcoffeecart.com", logo: "☕", art: "a-coffee", rating: 4.9, reviews: 142, years: 2, jobs: 0, tagline: "📍 ETSU campus · open till 2pm.", neighborhood: "Johnson City", verified: true, emergency: false, openNow: true, foodTruck: true },
  { id: 13, slug: "main-street-pizza", name: "Main Street Pizza Co.", category: "Restaurant · Pizza", networkId: "food", tier: "pro", website: "https://mainstreetpizza.com", logo: "🍕", art: "a-pizza", rating: 4.8, reviews: 410, years: 22, jobs: 0, tagline: "Wood-fired. Order pickup in a tap.", neighborhood: "Bristol", verified: true, emergency: false, openNow: true, foodTruck: false },
  { id: 14, slug: "appalachian-pest-control", name: "Appalachian Pest Control", category: "Pest Control", networkId: "home", tier: "free", website: "https://appalachianpest.com", logo: "🐜", art: "a-generic", rating: 4.7, reviews: 96, years: 13, jobs: 421, tagline: "Termites, mosquitoes, wildlife — quarterly plans.", neighborhood: "Kingsport", verified: true, emergency: false, openNow: true, foodTruck: false },
  { id: 15, slug: "state-line-garage-doors", name: "State Line Garage Doors", category: "Garage Doors", networkId: "home", tier: "free", website: "https://statelinegaragedoors.com", logo: "🚪", art: "a-generic", rating: 4.8, reviews: 74, years: 10, jobs: 233, tagline: "Broken spring? Same-day fix, most models in stock.", neighborhood: "Bristol", verified: true, emergency: true, openNow: true, foodTruck: false },
  { id: 16, slug: "cornerstone-cpa", name: "Cornerstone CPA", category: "Accounting & Tax", networkId: "financial", tier: "free", website: "https://cornerstonecpa.com", logo: "📊", art: "a-generic", rating: 4.9, reviews: 61, years: 17, jobs: 0, tagline: "Small-business books & tax, done right.", neighborhood: "Johnson City", verified: true, emergency: false, openNow: false, foodTruck: false },
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

// Row selectors (geography-agnostic; later these become PROPHET-scored / location-aware queries)
export const rowAvailableNow = () => BUSINESSES.filter((b) => b.openNow && !b.foodTruck).slice(0, 8);
export const rowEmergency = () => BUSINESSES.filter((b) => b.emergency);
export const rowTopRated = () => [...BUSINESSES].filter((b) => !b.foodTruck).sort((a, b) => b.rating - a.rating).slice(0, 8);
export const rowFoodTrucks = () => BUSINESSES.filter((b) => b.foodTruck);
export const rowByNetwork = (networkId: string) => BUSINESSES.filter((b) => b.networkId === networkId);
export const spotlight = () => getBusiness("reliable-paving")!;

// FOOD FRONT DOOR — food is the daily-habit surface that pulls people in.
export const rowFood = () => BUSINESSES.filter((b) => b.networkId === "food");

// Deterministic "food pick of the day" — rotates daily so there's a fresh reason to open the app.
export function foodPickOfDay(): Business {
  const food = rowFood();
  const day = Math.floor(Date.now() / 86_400_000); // days since epoch
  return food[day % food.length];
}
