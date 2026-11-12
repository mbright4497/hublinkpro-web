import Link from "next/link";
import PosterCard from "@/components/PosterCard";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import {
  NETWORKS,
  rowAvailableNow,
  rowEmergency,
  rowTopRated,
  rowFoodTrucks,
  rowByNetwork,
  rowFood,
  foodPickOfDay,
  houseChannel,
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
  { ic: "⚡", h: "Speed-to-Lead AI", p: "Automatic follow-up when someone reaches out to your business." },
  { ic: "⭐", h: "Review Engine", p: "Ask every customer for an honest review after the job." },
  { ic: "📡", h: "Neighborhood Radar", p: "Neighborhood-level demand signals for the services you offer." },
  { ic: "📞", h: "Missed-Call Rescue", p: "Automatic text-back when you miss a call." },
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
        <a href="#networks">Networks</a>
        <a href="#food-trucks">Food Trucks</a>
        <a href="#your-channel">Your Channel</a>
        <a href="#automations">HLP Automations</a>
      </div>
      <Link href="/login" className="signin">
        Sign in
      </Link>
      <Link href="/login" className="listbtn">
        Build your Channel
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
        <a className="see" href="#networks">
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

// The self-advertisement: rather than pitch the platform, show a business owner the
// finished product. The card links straight to our own fully loaded Channel.
function ChannelShowcase() {
  const house = houseChannel();
  if (!house) return null;
  return (
    <section className="section showcase" id="your-channel">
      <div className="showcase-copy">
        <div className="badge">🅷 For business owners</div>
        <h2>See what your Channel looks like</h2>
        <p className="sub" style={{ maxWidth: 460 }}>
          Not a listing in a directory — your own branded space. Reel, work gallery, services,
          hours, and a direct line to the neighbors who need you. This one is ours. Open it,
          then picture your name on it.
        </p>
        <div className="hero-cta" style={{ marginTop: 4 }}>
          <Link href={`/business/${house.slug}`} className="btn-primary">
            Tour a live Channel
          </Link>
          <Link href="/list-your-business" className="btn-ghost">
            Claim your slot →
          </Link>
        </div>
      </div>
      <div className="track showcase-track">
        <PosterCard b={house} />
      </div>
    </section>
  );
}

export default function Home() {
  const foodPick = foodPickOfDay();
  const foodChannels = foodPick ? [foodPick, ...rowFood().filter((b) => b.id !== foodPick.id)] : [];
  return (
    <>
      <Nav />

      <div id="discover" />

      {/* Cinematic hero — "Tonight in..." rotating billboard + live radar strip */}
      <Hero />

      {/* What this is and how to use it, up front */}
      <HowItWorks />

      {/* FOOD FRONT DOOR — the daily-habit surface (food is what brings everyone back) */}
      {foodPick ? (
      <section className="row" id="eat" style={{ marginTop: 18 }}>
          <div className="rowhead">
            <h2>
              <span>🍽️</span> Eat Local Tonight · Johnson City
            </h2>
            <a className="see" href="#food-trucks">
              Food Trucks ›
            </a>
          </div>
          <p className="sub" style={{ padding: "0 5vw", margin: "-6px 0 14px" }}>
            Today&apos;s favorite:{" "}
            <b style={{ color: "var(--color-light)" }}>{foodPick.name}</b> — {foodPick.tagline}
          </p>
          <div className="track">
            {foodChannels.map((b) => (
              <PosterCard key={b.id} b={b} />
            ))}
          </div>
        </section>
      ) : (
        <section className="section" id="eat" style={{ marginTop: 18 }}>
          <h2>🍽️ Food trucks: list free</h2>
          <p className="sub">
            We&apos;re signing up the first food trucks in Johnson City and Kingsport. Post where
            you&apos;re parked today and let neighbors find you.
          </p>
          <Link href="/list-your-business" className="btn-primary">
            List a food truck — free
          </Link>
        </section>
      )}

      {/* Grid-first rows */}
      <Row title="Available Right Now" icon="🟢" items={rowAvailableNow()} />
      <Row title="Emergency Service — One Tap" icon="🚨" items={rowEmergency()} emergency />
      <Row title="Top Rated Near You" icon="⭐" items={rowTopRated()} />
      <Row title="Food Trucks Live Today" icon="🌮" items={rowFoodTrucks()} />
      <div id="food-trucks" />
      <Row title="Home Services in 37604" icon="🏠" items={rowByNetwork("home")} />

      {/* Browse every Network */}
      <section className="section" id="networks">
        <h2>Browse every Network</h2>
        <p className="sub">Max 3 pros per service, per neighborhood. Curated, never crowded.</p>
        <div className="sectorgrid">
          {NETWORKS.map((s) => (
            <Link key={s.id} href={`/network/${s.slug}`} className="sector" style={{ background: s.hue }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              {s.name}
              <small>{s.count} services</small>
            </Link>
          ))}
        </div>
      </section>

      {/* Our own Channel — the product, demonstrated instead of described */}
      <ChannelShowcase />

      {/* HLP Automations */}
      <section className="section" id="automations">
        <h2>HLP Automations</h2>
        <p className="sub">In development. Founding members get first access.</p>
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
        <h2>Opening in the Tri-Cities</h2>
        <p className="sub">Founding listings are open in these ZIPs.</p>
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
          © 2026 HubLinkPro. Local discovery for the Tri-Cities. HubLinkPro is a directory; we do not perform, vouch for, or guarantee the work of any listed business.
          <div className="footlegal">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/sms">SMS Terms</Link>
          </div>
        </div>
        <div className="col">
          <h4>Neighbors</h4>
          <a href="#discover">Discover local pros</a>
          <a href="#networks">Browse Networks</a>
          <a href="#food-trucks">Food Truck Radar</a>
        </div>
        <div className="col">
          <h4>Businesses</h4>
          <Link href="/list-your-business">Claim your neighborhood slot</Link>
          <Link href="/list-your-business">List a food truck — free</Link>
          <Link href="/business/hublinkpro">See a live Channel</Link>
          <a href="#automations">HLP Automations</a>
        </div>
        <div className="col">
          <h4>Legal</h4>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/sms">SMS Terms &amp; Conditions</Link>
        </div>
      </footer>
    </>
  );
}
