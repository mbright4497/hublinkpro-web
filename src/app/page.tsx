import MarketHome from "@/components/MarketHome";
import { getDefaultMarket } from "@/lib/markets";

export const revalidate = 60;

export default async function Home() {
  return <MarketHome market={await getDefaultMarket()} />;
}
