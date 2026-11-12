import Link from "next/link";
import PosterCard from "@/components/PosterCard";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import { NETWORKS, type Business } from "@/lib/data";
import { localChannels, houseStage } from "@/lib/channels";
import HouseStage from "@/components/HouseStage";
import { SITE_SOCIALS } from "@/lib/site";

export const revalidate = 60;

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
        <span>HubLink<span className="pro">Pro</span></span>
      </div>
      <div className="navlinks">
        <a href="#discover">Discover</a>
        <a href="#networks">Networks</a>
        <a href="#food-trucks">Food Trucks</a>
        <Link href="/contact">Contact</Link>
        <a href="#your-channel">Your Channel</a>
        <a href="#automations">HLP Automations</a>
      </div>
      <Link href="/login?mode=signin" className="signin">
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
  items: Business[];
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

export default async function Home() {
  const [local, stage] = await Promise.all([localChannels(), houseStage()]);
  const food = local.filter((b) => b.networkId === "food");
  // Deterministic daily pick, same rotation as before, now over real Channels.
  const foodPick = food.length ? food[Math.floor(Date.now() / 86_400_000) % food.length] : undefined;
  const foodChannels = foodPick ? [foodPick, ...food.filter((b) => b.id !== foodPick.id)] : [];
  const trucks = local.filter((b) => b.foodTruck);
  const justListed = local.slice(0, 10);
  const networkRows = NETWORKS.filter((n) => n.id !== "food")
    .map((n) => ({ n, items: local.filter((b) => b.networkId === n.id) }))
    .filter((r) => r.items.length > 0);
  return (
    <>
      <Nav />

      <div id="discover" />

      {/* Cinematic hero — "Tonight in..." rotating billboard + live radar strip */}
      <Hero />

      {/* Our own live Channel, up top: the product demonstrated instead of described */}
      {stage && <HouseStage stage={stage} />}

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

      {/* Rows read live, approved Channels. An empty row hides itself. */}
      <Row title="Just Listed on HubLinkPro" icon="🆕" items={justListed} />
      <Row title="Food Trucks Live Today" icon="🌮" items={trucks} />
      <div id="food-trucks" />
      {networkRows.map(({ n, items }) => (
        <Row key={n.id} title={n.name} icon={n.icon} items={items} />
      ))}

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
          <Link href="/channel/hublinkpro">See a live Channel</Link>
          <a href="#automations">HLP Automations</a>
          <Link href="/contact">Message us</Link>
        </div>
        {SITE_SOCIALS.length > 0 && (
          <div className="col">
            <h4>Follow us</h4>
            {SITE_SOCIALS.map((x) => (
              <a key={x.label} href={x.url} target="_blank" rel="noopener noreferrer">
                {x.label}
              </a>
            ))}
          </div>
        )}
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
