import Link from "next/link";
import PosterCard from "@/components/PosterCard";
import {
  SECTORS,
  rowAvailableNow,
  rowEmergency,
  rowTopRated,
  rowFoodTrucks,
  rowBySector,
  spotlight,
} from "@/lib/data";

const LIVE_ZIPS = [
  "37601 · Johnson City",
  "37604 · Johnson City",
  "37615 · Johnson City",
  "37660 · Kingsport",
  "37663 · Kingsport",
  "37664 · Kingsport",
];

const AUTOMATIONS = [
  { ic: "⚡", h: "Speed-to-Lead AI", p: "Every inquiry answered in seconds — before your competitor even sees it." },
  { ic: "⭐", h: "Review Engine", p: "Turn happy jobs into a steady stream of real, verified 5-star reviews." },
  { ic: "📡", h: "Neighborhood Radar", p: "Know which streets need your service before the homeowner does." },
  { ic: "📞", h: "Missed-Call Rescue", p: "Missed a call? We text them back instantly so the lead never gets away." },
];

function Nav() {
  return (
    <nav className="nav">
      <div className="brand">
        <span className="logo">H</span>
        HubLink<span className="pro">Pro</span>
      </div>
      <div className="navlinks">
        <a href="#discover">Discover</a>
        <a href="#sectors">Sectors</a>
        <a href="#food-trucks">Food Trucks</a>
        <a href="#automations">HLP Automations</a>
      </div>
      <Link href="/list-your-business" className="listbtn">
        List your business
      </Link>
    </nav>
  );
}

function Row({
  title,
  icon,
  items,
  emergency = false,
}: {
  title: string;
  icon: string;
  items: ReturnType<typeof rowAvailableNow>;
  emergency?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className={`row ${emergency ? "emerg" : ""}`}>
      <div className="rowhead">
        <h2>
          <span>{icon}</span> {title}
        </h2>
        <a className="see" href="#sectors">
          See all ›
        </a>
      </div>
      <div className="track">
        {items.map((b) => (
          <PosterCard key={b.id} b={b} emergency={emergency} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const spot = spotlight();
  return (
    <>
      <Nav />

      <div className="loc" id="discover">
        <span className="ping" />
        Showing pros in&nbsp;<b>Johnson City · 37604</b>
        <a className="chg" href="#">
          change
        </a>
        &nbsp;·&nbsp;
        <span style={{ color: "var(--color-muted)" }}>detected automatically</span>
      </div>

      {/* Spotlight billboard */}
      <section className="spot">
        <div className="art" />
        <div className="grad" />
        <div className="in">
          <div className="badge">🔥 Neighborhood favorite · Paving</div>
          <h1>{spot.name}</h1>
          <div className="meta">
            <span className="stars">★★★★★ {spot.rating.toFixed(1)}</span>
            <span style={{ color: "var(--color-muted)" }}>({spot.reviews})</span>
            <span className="verified">✓ HLP Verified</span>
            <span>
              · {spot.years} yrs · {spot.jobs} jobs
            </span>
          </div>
          <p>{spot.tagline}</p>
          <div className="cta">
            <Link href={`/business/${spot.slug}`} className="btn-primary">
              ⚡ Connect now
            </Link>
            <Link href={`/business/${spot.slug}`} className="btn-ghost">
              ▶ See their work
            </Link>
          </div>
        </div>
      </section>

      {/* Grid-first rows */}
      <Row title="Available Right Now" icon="🟢" items={rowAvailableNow()} />
      <Row title="Emergency Service — One Tap" icon="🚨" items={rowEmergency()} emergency />
      <Row title="Top Rated Near You" icon="⭐" items={rowTopRated()} />
      <Row title="Food Trucks Live Today" icon="🌮" items={rowFoodTrucks()} />
      <div id="food-trucks" />
      <Row title="Home Services in 37604" icon="🏠" items={rowBySector("home")} />

      {/* Browse every sector */}
      <section className="section" id="sectors">
        <h2>Browse every sector</h2>
        <p className="sub">Max 3 pros per service, per neighborhood. Curated, never crowded.</p>
        <div className="sectorgrid">
          {SECTORS.map((s) => (
            <div key={s.id} className="sector" style={{ background: s.hue }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              {s.name}
              <small>{s.count} services</small>
            </div>
          ))}
        </div>
      </section>

      {/* HLP Automations */}
      <section className="section" id="automations">
        <h2>HLP Automations</h2>
        <p className="sub">The AI growth engine behind every listed business.</p>
        <div className="autogrid">
          {AUTOMATIONS.map((a) => (
            <div key={a.h} className="autocard">
              <div className="ic">{a.ic}</div>
              <h3>{a.h}</h3>
              <p>{a.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live coverage */}
      <section className="section">
        <h2>Live now in the Tri-Cities</h2>
        <p className="sub">Neighborhood by neighborhood. More going live every week.</p>
        <div className="chips">
          {LIVE_ZIPS.map((z) => (
            <span key={z} className="chip">
              {z}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="foot">
        <div className="copy">
          <div className="fb">
            <span
              className="logo"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "linear-gradient(135deg,var(--color-brand2),var(--color-brand))",
                display: "grid",
                placeItems: "center",
                color: "#1a1205",
                fontWeight: 900,
              }}
            >
              H
            </span>
            HubLinkPro
          </div>
          © 2026 HubLinkPro. Trusted pros. Verified work. Your community.
        </div>
        <div className="col">
          <h4>Neighbors</h4>
          <a href="#discover">Discover local pros</a>
          <a href="#sectors">Browse sectors</a>
          <a href="#food-trucks">Food Truck Radar</a>
        </div>
        <div className="col">
          <h4>Businesses</h4>
          <Link href="/list-your-business">Claim your neighborhood slot</Link>
          <Link href="/list-your-business">List a food truck — free</Link>
          <a href="#automations">HLP Automations</a>
        </div>
      </footer>
    </>
  );
}
