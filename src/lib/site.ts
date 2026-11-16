// HubLinkPro's own social links, shown in the homepage footer. Empty until real URLs are set:
// nothing renders for a blank entry, so no dead or placeholder links ever ship.
export const SITE_SOCIALS: { label: string; url: string }[] = [
  { label: "Facebook", url: "https://www.facebook.com/TriCitiesHubLinkPro" },
  // { label: "Instagram", url: "https://instagram.com/..." },
  // { label: "YouTube", url: "https://youtube.com/@..." },
  // { label: "TikTok", url: "https://tiktok.com/@..." },
];

// Canonical origin for sitemap, canonical tags and structured data.
export const SITE_URL = "https://hublinkpro.com";

// Public GA4 Measurement ID (not a secret) for the hublinkpro.com web stream.
export const GA_MEASUREMENT_ID = "G-XT1P5E74SD";

// Serialize JSON-LD safely for a <script> tag (no stray "</script>" or "<!--").
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
