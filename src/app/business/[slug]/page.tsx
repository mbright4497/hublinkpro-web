import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBusiness, getNetwork, BUSINESSES } from "@/lib/data";

const FAVORITE_ZIPS = ["37601", "37604", "37615", "37660", "37663", "37664"];

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

  const heroBadge = b.house
    ? "🅷 This is a live HubLinkPro Channel"
    : b.tier === "favorite"
    ? `🔥 Neighborhood Favorite · ${network?.name ?? ""}`
    : b.tier === "pro"
    ? `★ Verified Pro · ${network?.name ?? ""}`
    : `${b.logo} ${network?.name ?? ""}`;

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
          <div className="badge">{heroBadge}</div>
          <h1>{b.name}</h1>
          {/* Every stat here renders only when we actually have it. A zero is never
              dressed up as a number — that's how a real listing stays trustworthy. */}
          <div className="meta">
            {b.reviews > 0 && (
              <>
                <span className="stars">★ {b.rating.toFixed(1)}</span>
                <span style={{ color: "var(--color-muted)" }}>({b.reviews} Google reviews)</span>
              </>
            )}
            {b.verified && <span className="verified">✓ HLP Verified</span>}
            <span>· {b.neighborhood}</span>
            {b.jobs > 0 && <span>· {b.jobs} jobs</span>}
            {b.years > 0 && <span>· {b.years} yrs in business</span>}
          </div>
          <p>{b.tagline}</p>
          <div className="cta">
            <a href="#connect" className="btn-primary">
              {b.house
                ? "⚡ Claim your slot"
                : b.foodTruck
                ? "🛒 Order now"
                : b.emergency
                ? "🚨 Request service"
                : "⚡ Connect now"}
            </a>
            {b.phone && (
              <a href={`tel:${b.phone.replace(/[^0-9+]/g, "")}`} className="btn-ghost">
                📞 {b.phone}
              </a>
            )}
            {b.house && b.website ? (
              <a href="#your-channel-services" className="btn-ghost">
                🎬 See what&apos;s included
              </a>
            ) : !b.phone && b.tier === "free" && b.website ? (
              <a href={b.website} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                🌐 Visit website
              </a>
            ) : !b.phone ? (
              <a href="#connect" className="btn-ghost">💬 Message</a>
            ) : null}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="section">
        <h2>About</h2>
        {b.house ? (
          <p className="sub" style={{ maxWidth: 680, fontSize: 16, color: "var(--color-mist)" }}>
            You&apos;re looking at a real HubLinkPro Channel — ours. This is the exact page a
            business gets: its own branded space with a reel, a work gallery, services, and a
            direct line to the neighbors who need it. HubLinkPro is where people in{" "}
            {b.neighborhood} find the pros they actually call, and the growth engine that keeps
            those pros booked. Scroll it, then picture your name on it.
          </p>
        ) : (
          <p className="sub" style={{ maxWidth: 640, fontSize: 16, color: "var(--color-mist)" }}>
            {b.name} is a {b.verified ? "HubLinkPro-verified " : ""}
            {b.category.toLowerCase()} serving {b.neighborhood} and the surrounding Tri-Cities.
            {b.years > 0 ? ` ${b.years} years in business` : ""}
            {b.jobs > 0 ? ` and ${b.jobs}+ completed jobs` : ""}. {b.tagline}
          </p>
        )}
        {b.website && (
          <p className="sub" style={{ marginTop: 8 }}>
            🌐{" "}
            <a
              href={b.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-brand2)", fontWeight: 600 }}
            >
              {b.website.replace(/^https?:\/\//, "")}
            </a>
          </p>
        )}
      </section>

      {/* Our Work — gallery (full Channel) */}
      {b.gallery && b.gallery.length > 0 && (
        <section className="section">
          <h2>{b.house ? "Inside the platform" : "Our Work"}</h2>
          <p className="sub">
            {b.house ? "The surfaces your business shows up on." : `Recent jobs from ${b.name}.`}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {b.gallery.map((g, i) => (
              <div
                key={i}
                className={g.art}
                style={{
                  position: "relative",
                  height: 150,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1px solid var(--color-line)",
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <span
                  style={{
                    width: "100%",
                    padding: "18px 12px 10px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    background: "linear-gradient(180deg, transparent, rgba(6,9,16,.9))",
                  }}
                >
                  {g.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services (Pro + Favorite) */}
      {b.services && b.services.length > 0 && (
        <section className="section" id="your-channel-services">
          <h2>Services</h2>
          <p className="sub">What {b.name} offers.</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 12,
              maxWidth: 760,
            }}
          >
            {b.services.map((s) => (
              <div
                key={s}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--color-card)",
                  border: "1px solid var(--color-line)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#f4f6fb",
                }}
              >
                <span style={{ color: "var(--color-brand2)" }}>✓</span> {s}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Why choose us — stands in for showcased reviews on Channels that don't have
          real ones yet. Nothing here is a testimonial, so nothing here can be a fake one. */}
      {b.pitch && b.pitch.length > 0 && (
        <section className="section">
          <h2>{b.house ? "Why pros choose HubLinkPro" : `Why neighbors choose ${b.name}`}</h2>
          <p className="sub">
            {b.house
              ? "The difference between owning a slot and buying a lead."
              : `What sets ${b.name} apart.`}
          </p>
          <div className="autogrid">
            {b.pitch.map((p) => (
              <div key={p.h} className="autocard">
                <div className="ic">{p.ic}</div>
                <h3>{p.h}</h3>
                <p>{p.p}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Commercial reel — Verified Pro and Neighborhood Favorite only */}
      {b.tier !== "free" && (
        <section className="section">
          <h2>Watch {b.name}</h2>
          <p className="sub">
            {b.house
              ? "Every Verified Pro and Neighborhood Favorite gets a reel in this slot. This one is ours."
              : "Their commercial reel — the video that runs on their HubLinkPro Channel."}
          </p>
          <div
            style={{
              position: "relative",
              maxWidth: 760,
              aspectRatio: "16 / 9",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid var(--color-line)",
              background:
                "radial-gradient(600px 300px at 50% 40%, rgba(251,146,60,.18), transparent 60%), linear-gradient(160deg, #14203a, #0b1526)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  margin: "0 auto 12px",
                  borderRadius: "50%",
                  background: "linear-gradient(90deg, var(--color-brand), var(--color-brand2))",
                  display: "grid",
                  placeItems: "center",
                  color: "#1a1205",
                  fontSize: 24,
                  fontWeight: 900,
                }}
              >
                ▶
              </div>
              <span style={{ color: "var(--color-mist)", fontSize: 14, fontWeight: 600 }}>
                {b.name} — Commercial Reel
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Reviews (full Channel) */}
      {b.reviewsList && b.reviewsList.length > 0 && (
        <section className="section">
          <h2>What neighbors say</h2>
          <p className="sub">
            ★ {b.rating.toFixed(1)} average across {b.reviews} reviews.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {b.reviewsList.map((r, i) => (
              <div key={i} className="autocard">
                <div style={{ color: "var(--color-amber)", fontWeight: 800, marginBottom: 8 }}>
                  {"★".repeat(r.stars)}
                </div>
                <p style={{ color: "var(--color-mist)", fontSize: 14, lineHeight: 1.5, margin: "0 0 10px" }}>
                  “{r.text}”
                </p>
                <span style={{ color: "var(--color-muted)", fontSize: 13, fontWeight: 700 }}>
                  — {r.author}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hyperlocal reach — Neighborhood Favorite only (the marquee tier).
          Suppressed on the house Channel: HubLinkPro doesn't buy a slot from itself. */}
      {b.tier === "favorite" && !b.house && (
        <section className="section">
          <h2>🔥 Hyperlocal reach</h2>
          <p className="sub" style={{ maxWidth: 640 }}>
            As the Neighborhood Favorite for {b.category.toLowerCase()}, {b.name} owns the top slot —
            featured across these neighborhoods and surfaced to people right when they need it.
          </p>
          <div className="chips" style={{ marginBottom: 16 }}>
            {FAVORITE_ZIPS.map((z) => (
              <span key={z} className="chip">
                📍 {z}
              </span>
            ))}
          </div>
          <div className="autocard" style={{ maxWidth: 640, borderColor: "rgba(251,146,60,.4)" }}>
            <div className="ic">📡</div>
            <h3>Reach neighbors before they even search</h3>
            <p>
              HubLinkPro surfaces {b.name} to nearby homeowners the moment their neighborhood signals a
              need — the hyperlocal advantage only the Neighborhood Favorite gets.
            </p>
          </div>
        </section>
      )}

      {/* Coverage — house Channel only. Where slots are open right now. */}
      {b.house && (
        <section className="section">
          <h2>📍 Live now — and open slots</h2>
          <p className="sub" style={{ maxWidth: 640 }}>
            Every ZIP with a post office is a sellable slot. One business, per category, per ZIP —
            when it&apos;s taken, it&apos;s taken. These are live today, with more going up every week.
          </p>
          <div className="chips">
            {FAVORITE_ZIPS.map((z) => (
              <span key={z} className="chip">
                📍 {z}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Hours & contact */}
      {(b.hours || b.phone) && (
        <section className="section">
          <h2>Hours & contact</h2>
          <div className="chips">
            {b.hours && <span className="chip">🕐 {b.hours}</span>}
            {b.phone && <span className="chip">📞 {b.phone}</span>}
            <span className="chip">📍 {b.neighborhood} & the Tri-Cities</span>
          </div>
        </section>
      )}

      {/* Connect */}
      <section className="section" id="connect">
        <h2>{b.house ? "Claim your neighborhood slot" : `Connect with ${b.name}`}</h2>
        <p className="sub">
          {b.house
            ? "Free to start. Food trucks free forever. Never more than 3 pros per service, per area — so the slot you take is a slot your competitor can't."
            : "One tap. We route you straight to them — no forms sold to seven strangers."}
        </p>
        <Link href="/list-your-business" className="btn-primary">
          {b.house ? "⚡ List my business" : b.foodTruck ? "🛒 Order now" : "⚡ Connect now"}
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
