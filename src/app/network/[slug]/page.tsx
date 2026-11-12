import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PosterCard from "@/components/PosterCard";
import { getNetworkBySlug, rowByNetwork, categoriesInNetwork, NETWORKS } from "@/lib/data";

export function generateStaticParams() {
  return NETWORKS.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const n = getNetworkBySlug(slug);
  if (!n) return { title: "HubLinkPro" };
  return {
    title: `${n.name} — HubLinkPro`,
    description: `${n.name} in the Tri-Cities. Founding listings are open.`,
  };
}

export default async function NetworkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const network = getNetworkBySlug(slug);
  if (!network) notFound();

  const channels = rowByNetwork(network.id);
  const categories = categoriesInNetwork(network.id);

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="logo">H</span>
          <span>HubLink<span className="pro">Pro</span></span>
        </Link>
        <Link href="/" className="navlinks" style={{ color: "var(--color-mist)" }}>
          ← Back to discover
        </Link>
        <Link href="/list-your-business" className="listbtn">
          List your business
        </Link>
      </nav>

      {/* Network header */}
      <section className="spot" style={{ height: 240 }}>
        <div className="art" style={{ width: "100%", background: network.hue }} />
        <div className="grad" />
        <div className="in">
          <div className="badge">
            {network.icon} Network
          </div>
          <h1>{network.name}</h1>
          <p>
            {channels.length > 0
              ? `${categories.length} categor${categories.length === 1 ? "y" : "ies"} · ${channels.length} channel${channels.length === 1 ? "" : "s"} in the Tri-Cities. Max 3 per service, per neighborhood.`
              : "This Network is opening up. Founding listings are open."}
          </p>
        </div>
      </section>

      {channels.length === 0 ? (
        <section className="section">
          <h2>Channels coming soon</h2>
          <p className="sub">
            No {network.name.toLowerCase()} listings yet. Want to be one of the first?
          </p>
          <Link href="/list-your-business" className="btn-primary">
            Claim your Channel →
          </Link>
        </section>
      ) : (
        categories.map((cat) => {
          const inCat = channels.filter((c) => c.category === cat);
          return (
            <section key={cat} className="row">
              <div className="rowhead">
                <h2>{cat}</h2>
                <span className="see">
                  {inCat.length} channel{inCat.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="track">
                {inCat.map((b) => (
                  <PosterCard key={b.id} b={b} emergency={b.emergency} />
                ))}
              </div>
            </section>
          );
        })
      )}

      <footer className="foot">
        <div className="copy">© 2026 HubLinkPro. Local discovery for the Tri-Cities. HubLinkPro is a directory; we do not perform, vouch for, or guarantee the work of any listed business.</div>
        <div className="col">
          <h4>Neighbors</h4>
          <Link href="/">Discover local pros</Link>
          <Link href="/#networks">Browse Networks</Link>
        </div>
      </footer>
    </>
  );
}
