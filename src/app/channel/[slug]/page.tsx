import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase/server";
import { SOCIALS, reel } from "@/lib/media";
import { requestBooking } from "./actions";

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
    openGraph: {
      title: c.name,
      description: c.tagline ?? undefined,
      images: c.hero_image_url ?? c.logo_url ? [c.hero_image_url ?? c.logo_url] : undefined,
    },
    robots: c.status === "live" ? undefined : { index: false },
  };
}

export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const c = await load((await params).slug);
  if (!c) notFound();
  const net = Array.isArray(c.networks) ? c.networks[0] : c.networks;
  const embed = embedUrl(c.video_url);
  const socials = SOCIALS.filter((sc) => (c.social_links as Record<string, string>)?.[sc.key]);
  const reels = ((c.reels as string[] | null) ?? []).map(reel);

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand"><span className="logo">H</span><span>HubLink<span className="pro">Pro</span></span></Link>
        <Link href="/" className="navlinks" style={{ color: "var(--color-mist)" }}>← Back to discover</Link>
        <Link href="/dashboard" className="listbtn">Build your Channel</Link>
      </nav>
      <div className="page" style={{ maxWidth: 860 }}>
        {c.status !== "live" && (
          <p className="note">Preview — this Channel isn&apos;t public yet ({c.status}).</p>
        )}
        {c.hero_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.hero_image_url} alt="" className="chbanner" />
        )}
        {c.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.logo_url} alt={`${c.name} logo`} className={`chlogo ${c.hero_image_url ? "over" : ""}`} />
        )}
        <div className="badge">{net?.name ?? "Local business"}{c.city ? ` · ${c.city}` : ""}</div>
        <h1>{c.name}</h1>
        {c.tagline && <p className="lead">{c.tagline}</p>}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "0 0 28px" }}>
          {c.status === "live" && (
            <a href="#book" className="btn-primary">📅 Request a booking</a>
          )}
          {c.booking_url && (
            <a href={c.booking_url} target="_blank" rel="noopener noreferrer" className="btn-ghost">🗓 Their calendar</a>
          )}
          {c.phone && (
            <a href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`} className="btn-ghost">📞 {c.phone}</a>
          )}
          {c.website && (
            <a href={c.website} target="_blank" rel="noopener noreferrer" className="btn-ghost">🌐 Website</a>
          )}
        </div>

        {socials.length > 0 && (
          <div className="socialrow">
            {socials.map((sc) => (
              <a key={sc.key} href={(c.social_links as Record<string, string>)[sc.key]} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                {sc.label}
              </a>
            ))}
          </div>
        )}

        {c.video_file_url ? (
          <video
            src={c.video_file_url}
            controls
            playsInline
            preload="metadata"
            poster={c.hero_image_url ?? undefined}
            className="chvideo"
          />
        ) : embed ? (
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

        {reels.length > 0 && (
          <>
            <h2 style={{ fontSize: 20, marginTop: 8 }}>Reels</h2>
            <div className="reels">
              {reels.map((r, i) => (
                <div key={`${r.href}-${i}`} className="reelcard">
                  {r.embed ? (
                    <div className={`reelframe ${r.tall ? "tall" : ""}`}>
                      <iframe
                        src={r.embed}
                        title={`${c.name} ${r.platform}`}
                        loading="lazy"
                        allow="encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : null}
                  <a href={r.href} target="_blank" rel="noopener noreferrer" className="reellink">
                    Watch on {r.platform} →
                  </a>
                </div>
              ))}
            </div>
          </>
        )}

        {c.status === "live" && (
          <section id="book" className="bookbox">
            <h2 style={{ fontSize: 20, marginTop: 0 }}>Request a booking</h2>
            {sp.requested ? (
              <p className="note ok">Sent. {c.name} will contact you at the number you gave.</p>
            ) : (
              <form action={requestBooking}>
                {sp.reqerror && <p className="note">Add your name and a phone number (and a valid email if you give one).</p>}
                <input type="hidden" name="slug" value={c.slug} />
                <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
                  <label>Leave this empty<input name="company_site" tabIndex={-1} autoComplete="off" /></label>
                </div>
                <div className="field"><label htmlFor="bk-name">Your name</label><input id="bk-name" name="name" required maxLength={120} autoComplete="name" /></div>
                <div className="field"><label htmlFor="bk-phone">Phone</label><input id="bk-phone" name="phone" type="tel" required maxLength={30} autoComplete="tel" /></div>
                <div className="field"><label htmlFor="bk-email">Email (optional)</label><input id="bk-email" name="email" type="email" maxLength={200} autoComplete="email" /></div>
                {c.services?.length > 0 && (
                  <div className="field">
                    <label htmlFor="bk-service">What do you need?</label>
                    <select id="bk-service" name="service" defaultValue="">
                      <option value="">Choose a service</option>
                      {c.services.map((s: string) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <div className="field"><label htmlFor="bk-time">Best day or time (optional)</label><input id="bk-time" name="preferred_time" maxLength={200} placeholder="Saturday morning" /></div>
                <div className="field"><label htmlFor="bk-msg">Tell them about the job (optional)</label><textarea id="bk-msg" name="message" rows={3} maxLength={2000} /></div>
                <label className="consent">
                  <input type="checkbox" name="sms_consent" />
                  <span>I agree to receive text messages about this request from the business and from HubLinkPro on its behalf. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase. <a href="/sms">SMS terms</a> · <a href="/privacy">Privacy</a></span>
                </label>
                <button className="btn-primary" type="submit">Send request</button>
              </form>
            )}
          </section>
        )}

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
