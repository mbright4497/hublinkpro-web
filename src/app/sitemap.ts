import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { NETWORKS } from "@/lib/data";
import { liveChannels } from "@/lib/channels";
import { getPosts } from "@/lib/blog";
import { liveTrucks } from "@/lib/trucks";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const channels = await liveChannels();
  const posts = await getPosts();
  // /food-trucks is noindex until a truck is live, so keep it out of the sitemap until then.
  const trucksLive = (await liveTrucks()).length > 0;

  // Only list category pages that actually have a live Channel; empty ones are thin content.
  const activeNetworks = new Set(channels.filter((c) => !c.house).map((c) => c.networkId));

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/list-your-business`, changeFrequency: "monthly", priority: 0.6 },
    ...(trucksLive ? [{ url: `${SITE_URL}/food-trucks`, changeFrequency: "hourly" as const, priority: 0.7 }] : []),
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...(posts.length ? [{ url: `${SITE_URL}/blog`, changeFrequency: "daily" as const, priority: 0.6 }] : []),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.date, changeFrequency: "monthly" as const, priority: 0.6 })),
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
