import type { Metadata } from "next";
import MarketHome from "@/components/MarketHome";
import { getDefaultMarket } from "@/lib/markets";

export const revalidate = 60;

// Pin the homepage canonical to "/" (the layout default resolved it to "/index").
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  return <MarketHome market={await getDefaultMarket()} />;
}
