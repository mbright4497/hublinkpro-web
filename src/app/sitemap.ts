import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { NETWORKS } from "@/lib/data";
import { liveChannels } from "@/lib/channels";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const channels = await liveChannels();

  // Only list category pages that actually have a live Channel; empty ones are thin content.
  const activeNetworks = new Set(channels.filter((c) => !c.house).map((c) => c.networkId));

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/list-your-business`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...NETWORKS.filter((n) => activeNetworks.has(n.id)).map((n) => ({
      url: `${SITE_URL}/network/${n.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...channels.map((c) => ({
      url: `${SITE_URL}/channel/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: c.house ? 0.7 : 0.9,
    })),
  ];
}
