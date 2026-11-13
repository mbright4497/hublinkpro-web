import Link from "next/link";
import PosterCard from "@/components/PosterCard";
import HowItWorks from "@/components/HowItWorks";
import { NETWORKS, type Business } from "@/lib/data";
import { localChannels, houseStage } from "@/lib/channels";
import Billboard from "@/components/Billboard";
import type { Market } from "@/lib/markets";
import { SITE_SOCIALS } from "@/lib/site";

const SERVICES = [
  { svc: "Food truck", icon: "🌮", note: "Lists free" },
  { svc: "Roofing", icon: "🏠", note: "Founding slot open" },
  { svc: "HVAC", icon: "❄️", note: "Founding slot open" },
  { svc: "Plumbing", icon: "🔧", note: "Founding slot open" },
  { svc: "Landscaping", icon: "🌿", note: "Founding slot open" },
  { svc: "Paving", icon: "🛣️", note: "Founding slot open" },
  { svc: "Electrical", icon: "⚡", note: "Founding slot open" },
  { svc: "Pressure washing", icon: "💦", note: "Founding slot open" },
];

function PosterRow({ title, icon, id, children }: { title: string; icon: string; id?: string; children: React.ReactNode }) {
  return (
    <section className="row" id={id}>
      <div className="rowhead">
        <h2>
          <span>{icon}</span> {title}
        </h2>
      </div>
      <div className="track">{children}</div>
    </section>
  );
}


const AUTOMATIONS = [
  { ic: "⚡", h: "Speed-to-Lead AI", p: "Automatic follow-up when someone reaches out to your business." },
  { ic: "⭐", h: "Review Engine", p: "Ask every customer for an honest review after the job." },
  { ic: "📡", h: "Neighborhood Radar", p: "Neighborhood-level demand signals for the services you offer." },
  { ic: "📞", h: "Missed-Call Rescue", p: "Automatic text-back when you miss a call." },
];

function Nav({ market }: { market: Market }) {
  return (
    <nav className="nav over">
      <div className="brand">
        <span className="logo">H</span>
        <span>HubLink<span className="pro">Pro</span></span>
      </div>
      <div className="navlinks">
        <a href="#discover">Discover</a>
        <a href="#networks">Networks</a>
        <a href="#food-trucks">Food Trucks</a>
        <Link href="/contact">Contact</Link>
        <Link href="/channel/hublinkpro">Your Channel</Link>
        <a href="#automations">HLP Automations</a>
      </div>
      <Link href="/choose-area" className="signin" aria-label={`Area: ${market.name}. Change`}>
        📍 {market.name}
      </Link>
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

export default async function MarketHome({ market }: { market: Market }) {
  const [local, stage] = await Promise.all([localChannels(market.slug), houseStage()]);
  const zips = market.featured_zips;
  const SLOTS = zips.length ? SERVICES.map((s, i) => ({ ...s, zip: zips[i % zips.length] })) : [];
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
      <Nav market={market} />

      {/* Full-bleed cinematic opener: our own Channel video behind the headline */}
      <Billboard stage={stage} eyebrow={`A HubLinkPro Channel · ${market.region_label}`} />

      {/* Genre row: every Network is a poster. Real categories, no invented businesses. */}
      <PosterRow title="Browse by genre" icon="🎬" id="networks">
        {NETWORKS.map((n) => (
          <Link key={n.id} href={`/network/${n.slug}`} className="poster npost" style={{ background: n.hue }} aria-label={n.name}>
            <span className="nicon" aria-hidden="true">{n.icon}</span>
            <span className="pshade" />
            <span className="pbody">
              <span className="pname">{n.name}</span>
              <span className="pcat">{n.count} services</span>
            </span>
            <span className="reveal">
              <span className="pname">{n.name}</span>
              <span className="qbtns">
                <span className="q1">Browse →</span>
              </span>
            </span>
          </Link>
        ))}
      </PosterRow>

      {/* Real Channels. Each row hides itself until it has one. */}
      <Row title="Just Listed on HubLinkPro" icon="🆕" items={justListed} />
      {foodPick && <Row title="Eat Local Tonight" icon="🍽️" items={foodChannels} />}
      <Row title="Food Trucks Live Today" icon="🌮" items={trucks} />
      <div id="food-trucks" />
      {networkRows.map(({ n, items }) => (
        <Row key={n.id} title={n.name} icon={n.icon} items={items} />
      ))}

      {/* Open founding slots: scarcity is the product (max 3 pros per service, per ZIP) */}
      {SLOTS.length > 0 && <PosterRow title="Claim your neighborhood" icon="📍">
        {SLOTS.map((x) => (
          <Link key={x.svc + x.zip} href="/login" className="poster slot" aria-label={`Claim ${x.svc} in ${x.zip}`}>
            <span className="slotpill">{x.note}</span>
            <span className="nicon" aria-hidden="true">{x.icon}</span>
            <span className="pshade" />
            <span className="pbody">
              <span className="pname">{x.svc}</span>
              <span className="pcat">{x.zip}</span>
            </span>
            <span className="reveal">
              <span className="pname">{x.svc}</span>
              <span className="tag">Max 3 pros per service, per ZIP. Be one of them.</span>
              <span className="qbtns">
                <span className="q1">Claim it →</span>
              </span>
            </span>
          </Link>
        ))}
      </PosterRow>}

      {/* What this is, kept short and below the posters */}
      <HowItWorks />

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
      {zips.length > 0 && (
        <section className="section">
          <h2>Opening in {market.place}</h2>
          <p className="sub">Founding listings are open in these ZIPs.</p>
          <div className="chips">
            {zips.map((z) => (
              <span key={z} className="chip">
                {z}
              </span>
            ))}
          </div>
        </section>
      )}

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
          © 2026 HubLinkPro. Local discovery for {market.place}. HubLinkPro is a directory; we do not perform, vouch for, or guarantee the work of any listed business.
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
