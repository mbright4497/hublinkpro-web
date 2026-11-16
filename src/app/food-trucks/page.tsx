import Link from "next/link";
import type { Metadata } from "next";
import { liveTrucks } from "@/lib/trucks";
import { localChannels } from "@/lib/channels";
import { getDefaultMarket } from "@/lib/markets";
import TruckMapLoader from "@/components/TruckMapLoader";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const live = await liveTrucks();
  return {
    title: "Food Trucks Open Now | HubLinkPro",
    description: "See which local food trucks are open right now and where they're parked.",
    // Nothing to index until at least one truck has gone live.
    robots: live.length ? undefined : { index: false, follow: true },
  };
}

export default async function FoodTrucksPage() {
  const [live, market, all] = await Promise.all([liveTrucks(), getDefaultMarket(), localChannels()]);
  const trucks = all.filter((b) => b.foodTruck);
  const liveSlugs = new Set(live.map((t) => t.slug));
  const offDuty = trucks.filter((t) => !liveSlugs.has(t.slug));
  const center: [number, number] = [market.center_lat, market.center_lng];

  return (
    <main className="trucks">
      <p><Link href="/">← HubLinkPro</Link></p>
      <h1>🚚 Food Trucks Open Now</h1>
      <p className="sub">
        {live.length
          ? `${live.length} truck${live.length === 1 ? " is" : "s are"} parked and open right now.`
          : "No trucks are on the map right now. Check back around lunch."}
      </p>
      <TruckMapLoader center={center} trucks={live.map((t) => ({ slug: t.slug, name: t.name, note: t.note, lat: t.lat, lng: t.lng, until: t.liveUntil }))} />
      <p className="hint">A truck only shows here while its owner has it switched on, and drops off by itself when their time is up.</p>

      {live.length > 0 && (
        <>
          <h2>Open now</h2>
          <ul className="trucklist">
            {live.map((t) => (
              <li key={t.slug}>
                <Link href={`/channel/${t.slug}`}>
                  <strong>{t.name}</strong>
                  {t.note && <span> · {t.note}</span>}
                  <small>Here until {new Date(t.liveUntil).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}</small>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>{live.length ? "Other trucks" : "Our food trucks"}</h2>
      {offDuty.length ? (
        <ul className="trucklist">
          {offDuty.map((t) => (
            <li key={t.slug}>
              <Link href={`/channel/${t.slug}`}><strong>{t.name}</strong>{t.tagline && <span> · {t.tagline}</span>}<small>Not on the map right now</small></Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">No other trucks have joined yet.</p>
      )}

      <div className="trucksCta">
        <strong>Run a food truck?</strong> Listing is free. Tap one button when you park and your customers can find you.{" "}
        <Link href="/list-your-business" className="btn-primary">List my food truck</Link>
      </div>
    </main>
  );
}
