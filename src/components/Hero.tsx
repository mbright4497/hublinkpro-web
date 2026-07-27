"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BUSINESSES, rowFood, flagshipChannel } from "@/lib/data";

const CITY = "Johnson City";

// Featured billboard rotation — food-weighted (food is the front door), plus the flagship pro.
// The flagship is selected from the data by rating, never by a hardcoded slug.
const foodFeatured = [...rowFood()].sort((a, b) => b.rating - a.rating).slice(0, 3);
const flagship = flagshipChannel();
const FEATURED = [...foodFeatured, ...(flagship ? [flagship] : [])];

// Live "radar" counters — real state from the catalog. House Channel excluded: these
// counters are a claim about local businesses, so HubLinkPro must not inflate them.
const LOCAL = BUSINESSES.filter((b) => !b.house);
const openNowCount = LOCAL.filter((b) => b.openNow).length;
const trucksRolling = LOCAL.filter((b) => b.foodTruck && b.openNow).length;
const prosAvailable = LOCAL.filter((b) => b.networkId !== "food" && b.openNow).length;

// Radar pins — scattered live businesses across the neighborhood.
const RADAR_PINS = [
  { logo: "🌮", top: "24%", left: "58%" },
  { logo: "🍖", top: "40%", left: "28%" },
  { logo: "☕", top: "62%", left: "66%" },
  { logo: "🍕", top: "74%", left: "42%" },
  { logo: "🛣️", top: "30%", left: "78%" },
  { logo: "❄️", top: "56%", left: "22%" },
  { logo: "🔧", top: "80%", left: "60%" },
];

export default function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || FEATURED.length < 2) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const t = setInterval(() => setI((p) => (p + 1) % FEATURED.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  const b = FEATURED[i] ?? FEATURED[0];
  if (!b) return null;

  return (
    <section
      className="hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {FEATURED.map((f, idx) => (
        <div
          key={f.id}
          className={`hero-bg ${f.art}`}
          style={{ opacity: idx === i ? 1 : 0 }}
        />
      ))}
      <div className="hero-scrim" />

      {/* Neighborhood radar — live pins sweeping over the Tri-Cities */}
      <div className="hero-radar" aria-hidden="true">
        <div className="radar-rings" />
        <div className="radar-sweep" />
        {RADAR_PINS.map((p, idx) => (
          <span
            key={idx}
            className="radar-pin"
            style={{ top: p.top, left: p.left, animationDelay: `${idx * 0.35}s` }}
          >
            {p.logo}
          </span>
        ))}
        <div className="radar-center" />
      </div>

      <div className="hero-in">
        <span className="hero-eyebrow">
          <span className="ping" /> Live in {CITY}
        </span>
        <h1>Tonight in {CITY}</h1>
        <p className="lead">
          The good stuff, hand-picked — where locals actually eat and the pros they actually call.
        </p>

        <div className="hero-cta">
          <a href="#eat" className="btn-primary">
            See what&apos;s good tonight
          </a>
          <a href="#networks" className="btn-ghost">
            Browse all networks →
          </a>
        </div>

        <div className="hero-bottom">
          <Link href={`/business/${b.slug}`} className="hero-featcard">
            <span style={{ fontSize: 26 }}>{b.logo}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 800 }}>{b.name}</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--color-mist)" }}>
                <span className="stars">★ {b.rating.toFixed(1)}</span> · {b.category}
                {b.openNow ? (
                  <>
                    {" "}
                    · <span style={{ color: "#22c55e" }}>Open now</span>
                  </>
                ) : null}
              </span>
            </span>
            <span className="hero-ribbon">★ Featured tonight</span>
          </Link>

          <div className="hero-live">
            <div>
              <div className="n">{openNowCount}</div>
              <div className="l">open now</div>
            </div>
            {trucksRolling > 0 && (
              <div>
                <div className="n">{trucksRolling}</div>
                <div className="l">trucks rolling</div>
              </div>
            )}
            {prosAvailable > 0 && (
              <div>
                <div className="n">{prosAvailable}</div>
                <div className="l">pros available</div>
              </div>
            )}
          </div>
        </div>

        <div className="hero-dots">
          {FEATURED.map((f, idx) => (
            <button
              key={f.id}
              aria-label={`Show ${f.name}`}
              className={`hero-dot ${idx === i ? "on" : ""}`}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
