import Link from "next/link";
import type { Business } from "@/lib/data";

function orderLabel(b: Business, emergency: boolean): string {
  if (b.house) return "⚡ See the Channel";
  if (emergency) return "🚨 Dispatch now";
  if (b.foodTruck || b.category.toLowerCase().includes("restaurant")) return "🛒 Order";
  return "⚡ Connect";
}

export default function PosterCard({
  b,
  emergency = false,
}: {
  b: Business;
  emergency?: boolean;
}) {
  const jobs = b.jobs > 0 ? `· ${b.jobs} jobs` : "";
  return (
    <Link href={`/business/${b.slug}`} className="poster" aria-label={b.name}>
      <span className={`pimg ${b.art}`} />
      <span className="pshade" />
      <span className="plogo">{b.logo}</span>
      {b.verified && <span className="pv">✓ Verified</span>}
      <span className="pbody">
        <span className="pname">{b.name}</span>
        <span className="pcat">{b.category}</span>
        {/* Stats render only where they're real — a Channel with no reviews yet shows
            none rather than a hollow "★ 0.0 (0)". */}
        <span className="pstats">
          {b.reviews > 0 && (
            <>
              <span className="st">★ {b.rating.toFixed(1)}</span>
              <span>({b.reviews})</span>
            </>
          )}
          {b.years > 0 ? (
            <span>
              {b.years} yrs {jobs}
            </span>
          ) : b.house ? (
            <span>Free to start</span>
          ) : null}
        </span>
      </span>
      <span className="reveal">
        <span className="pname">{b.name}</span>
        <span className="tag">{b.tagline}</span>
        <span className="qbtns">
          <span className="q1">{orderLabel(b, emergency)}</span>
          <span className="q2">Profile</span>
        </span>
      </span>
    </Link>
  );
}
