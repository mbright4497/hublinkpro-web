import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBusiness, getNetwork, BUSINESSES } from "@/lib/data";

export function generateStaticParams() {
  return BUSINESSES.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = getBusiness(slug);
  if (!b) return { title: "HubLinkPro" };
  return {
    title: `${b.name} — ${b.category} | HubLinkPro`,
    description: b.tagline,
  };
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = getBusiness(slug);
  if (!b) notFound();
  const network = getNetwork(b.networkId);

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="logo">H</span>
          HubLink<span className="pro">Pro</span>
        </Link>
        <Link href="/" className="navlinks" style={{ color: "var(--color-mist)" }}>
          ← Back to discover
        </Link>
        <Link href="/list-your-business" className="listbtn">
          List your business
        </Link>
      </nav>

      {/* Hero */}
      <section className="spot" style={{ height: 320 }}>
        <div
          className={b.art}
          style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "62%" }}
        >
          <span
            style={{
              position: "absolute",
              right: "8%",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 130,
              filter: "drop-shadow(0 10px 30px rgba(0,0,0,.5))",
            }}
          >
            {b.logo}
          </span>
        </div>
        <div className="grad" />
        <div className="in">
          <div className="badge">{b.logo} {network?.name}</div>
          <h1>{b.name}</h1>
          <div className="meta">
            <span className="stars">★ {b.rating.toFixed(1)}</span>
            <span style={{ color: "var(--color-muted)" }}>({b.reviews} Google reviews)</span>
            {b.verified && <span className="verified">✓ HLP Verified</span>}
            <span>· {b.neighborhood}</span>
            {b.jobs > 0 && <span>· {b.jobs} jobs</span>}
            <span>· {b.years} yrs in business</span>
          </div>
          <p>{b.tagline}</p>
          <div className="cta">
            <a href="#connect" className="btn-primary">
              {b.foodTruck ? "🛒 Order now" : b.emergency ? "🚨 Request service" : "⚡ Connect now"}
            </a>
            <a href="#connect" className="btn-ghost">💬 Message</a>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>About</h2>
        <p className="sub" style={{ maxWidth: 640, fontSize: 16, color: "var(--color-mist)" }}>
          {b.name} is a {b.verified ? "HubLinkPro-verified " : ""}
          {b.category.toLowerCase()} serving {b.neighborhood} and the surrounding Tri-Cities.
          {b.years > 0 ? ` ${b.years} years in business` : ""}
          {b.jobs > 0 ? ` and ${b.jobs}+ completed jobs` : ""}. {b.tagline}
        </p>
      </section>

      <section className="section" id="connect">
        <h2>Connect with {b.name}</h2>
        <p className="sub">One tap. We route you straight to them — no forms sold to seven strangers.</p>
        <Link href="/list-your-business" className="btn-primary">
          {b.foodTruck ? "🛒 Order now" : "⚡ Connect now"}
        </Link>
      </section>

      <footer className="foot">
        <div className="copy">© 2026 HubLinkPro. Trusted pros. Verified work. Your community.</div>
        <div className="col">
          <h4>Neighbors</h4>
          <Link href="/">Discover local pros</Link>
        </div>
      </footer>
    </>
  );
}
