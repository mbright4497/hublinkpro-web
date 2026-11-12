import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("channels")
    .select("*, networks(name)")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

// Only YouTube and Vimeo are embedded; anything else becomes a plain link.
function embedUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const h = u.hostname.replace(/^www\./, "");
    if (h === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (h === "youtube.com" && u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    if (h === "youtube.com" && u.pathname.startsWith("/embed/")) return raw;
    if (h === "vimeo.com" && /^\/\d+/.test(u.pathname)) return `https://player.vimeo.com/video/${u.pathname.split("/")[1]}`;
  } catch {}
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await load((await params).slug);
  if (!c) return { title: "HubLinkPro" };
  return {
    title: `${c.name} | HubLinkPro`,
    description: c.tagline ?? undefined,
    robots: c.status === "live" ? undefined : { index: false },
  };
}

export default async function ChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = await load((await params).slug);
  if (!c) notFound();
  const net = Array.isArray(c.networks) ? c.networks[0] : c.networks;
  const embed = embedUrl(c.video_url);

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand"><span className="logo">H</span>HubLink<span className="pro">Pro</span></Link>
        <Link href="/" className="navlinks" style={{ color: "var(--color-mist)" }}>← Back to discover</Link>
        <Link href="/dashboard" className="listbtn">Build your Channel</Link>
      </nav>
      <div className="page" style={{ maxWidth: 860 }}>
        {c.status !== "live" && (
          <p className="note">Preview — this Channel isn&apos;t public yet ({c.status}).</p>
        )}
        <div className="badge">{net?.name ?? "Local business"}{c.city ? ` · ${c.city}` : ""}</div>
        <h1>{c.name}</h1>
        {c.tagline && <p className="lead">{c.tagline}</p>}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "0 0 28px" }}>
          {c.booking_url && (
            <a href={c.booking_url} target="_blank" rel="noopener noreferrer" className="btn-primary">📅 Book now</a>
          )}
          {c.phone && (
            <a href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`} className="btn-ghost">📞 {c.phone}</a>
          )}
          {c.website && (
            <a href={c.website} target="_blank" rel="noopener noreferrer" className="btn-ghost">🌐 Website</a>
          )}
        </div>

        {embed ? (
          <div style={{ position: "relative", paddingTop: "56.25%", marginBottom: 28, borderRadius: 16, overflow: "hidden", border: "1px solid var(--color-line)" }}>
            <iframe
              src={embed}
              title={`${c.name} commercial`}
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        ) : c.video_url ? (
          <p><a href={c.video_url} target="_blank" rel="noopener noreferrer" className="btn-ghost">▶ Watch our commercial</a></p>
        ) : null}

        {c.description && <p style={{ color: "var(--color-mist)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{c.description}</p>}

        {c.services?.length > 0 && (
          <>
            <h2 style={{ fontSize: 20, marginTop: 32 }}>Services</h2>
            <div className="chips">{c.services.map((s: string) => <span key={s}>{s}</span>)}</div>
          </>
        )}
        {c.zip_codes?.length > 0 && (
          <>
            <h2 style={{ fontSize: 20, marginTop: 28 }}>Serving</h2>
            <div className="chips">{c.zip_codes.map((z: string) => <span key={z}>{z}</span>)}</div>
          </>
        )}
      </div>
    </>
  );
}
