import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MarketHome from "@/components/MarketHome";
import WaitlistForm from "@/components/WaitlistForm";
import { DEFAULT_MARKET_SLUG, getMarket, isMarketSlug } from "@/lib/markets";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = isMarketSlug(slug) ? await getMarket(slug) : undefined;
  if (!m) return {};
  return m.launched
    ? { title: `HubLinkPro ${m.name}`, description: `Local pros and food trucks in ${m.place}, on HubLinkPro.`, alternates: { canonical: `/m/${m.slug}` } }
    : { title: `HubLinkPro is coming to ${m.name}`, robots: { index: false } };
}

export default async function MarketPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  if (slug === DEFAULT_MARKET_SLUG) redirect("/"); // the flagship market lives at the homepage
  const market = isMarketSlug(slug) ? await getMarket(slug) : undefined;
  if (!market) notFound();
  if (market.launched) return <MarketHome market={market} />;

  const sp = await searchParams;
  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="logo">H</span>
          <span>HubLink<span className="pro">Pro</span></span>
        </Link>
        <span />
        <Link href="/" className="signin">See the Tri-Cities →</Link>
      </nav>
      <div className="page" style={{ maxWidth: 560 }}>
        <h1>HubLinkPro is coming to {market.name}</h1>
        <p className="lead">
          We&apos;re building {market.place}&apos;s Channels now. Leave your email and we&apos;ll tell you the day we open,
          and pros can claim a founding slot first.
        </p>
        {sp.joined ? (
          <div className="bookbox"><h3>You&apos;re on the list.</h3><p className="lead">We&apos;ll email you when {market.name} opens.</p></div>
        ) : (
          <>
            {sp.error && <p className="note">Add a valid email, and a 5-digit ZIP if you include one.</p>}
            <WaitlistForm back={`/m/${market.slug}`} market={market.slug} />
          </>
        )}
        <p className="lead" style={{ fontSize: 14, marginTop: 24 }}>
          A business owner? <Link href="/list-your-business">List your business</Link>.
        </p>
      </div>
    </>
  );
}
