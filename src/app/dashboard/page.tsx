import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { saveChannel, signOut, setRequestStatus, addPortfolioItem, deletePortfolioItem, redeemCode, saveAvailability, cancelBooking } from "./actions";
import { SLOT_LENGTHS, TIMEZONES, WEEKDAYS, fmtWhen } from "@/lib/booking";
import MediaField from "@/components/MediaField";
import WorkAddForm from "@/components/WorkAddForm";
import ShareChannel from "@/components/ShareChannel";
import { SOCIALS } from "@/lib/media";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Channel | HubLinkPro" };

const ERRORS: Record<string, string> = {
  name: "Add your business name.",
  url: "One of your links doesn't look like a web address.",
  social: "One of your social links isn't a web address for that site (for example, the Facebook box needs a facebook.com link).",
  reel: "One of your reels isn't a link from TikTok, Instagram, Facebook, YouTube, or Vimeo.",
  save: "We couldn't save that. Try again.",
  notfound: "We couldn't find that Channel.",
};
const STATUS_TEXT: Record<string, string> = {
  draft: "Draft — only you can see it",
  pending: "In review — we'll publish it once it's verified",
  live: "Live on HubLinkPro",
  paused: "Paused — not visible to the public",
};

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: channels }, { data: networks }] = await Promise.all([
    supabase.from("channels").select("*").eq("owner_id", user.id).order("id").limit(1),
    supabase.from("networks").select("id,name").order("display_order"),
  ]);
  const ch = channels?.[0] ?? null;
  const { data: requests } = ch
    ? await supabase
        .from("booking_requests")
        .select("id,name,phone,email,service,message,preferred_time,sms_consent,status,created_at")
        .eq("channel_id", ch.id)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };
  const [{ data: rules }, { data: upcoming }] = ch
    ? await Promise.all([
        supabase.from("availability_rules").select("weekday,start_time,end_time").eq("channel_id", ch.id),
        supabase
          .from("bookings")
          .select("id,name,phone,email,service,message,starts_at,sms_consent")
          .eq("channel_id", ch.id)
          .eq("status", "confirmed")
          .gte("starts_at", new Date().toISOString())
          .order("starts_at")
          .limit(50),
      ])
    : [{ data: [] }, { data: [] }];
  const ruleByDay = new Map((rules ?? []).map((r) => [r.weekday as number, r]));
  const CAL_MSG: Record<string, string> = {
    saved: "Calendar saved.",
    cancelled: "Booking cancelled. That time is open again.",
    invalid: "Check the settings and try again.",
    hours: "End time must be after start time.",
    nodays: "Pick at least one day to take bookings.",
    error: "Something went wrong. Try again.",
  };
  const { data: work } = ch
    ? await supabase
        .from("portfolio_items")
        .select("id,title,caption,image_url,before_url,video_url")
        .eq("channel_id", ch.id)
        .order("sort_order")
        .order("id")
    : { data: [] };
  const workLimit = ch?.tier === "pro" ? null : 3;
  const workFull = workLimit !== null && (work?.length ?? 0) >= workLimit;
  const WORK_MSG: Record<string, string> = {
    added: "Added to your Channel.",
    removed: "Removed.",
    missing: "Add a photo or a video, and a short title.",
    limit: "Free Channels can show 3 jobs. Remove one, or upgrade to show more.",
    error: "Something went wrong. Try again.",
  };
  const CODE_MSG: Record<string, string> = {
    ok: "Code accepted. Pro features are now unlocked on your Channel.",
    empty: "Type your code first.",
    invalid: "That code isn't valid or has expired. Check the spelling.",
    used_up: "That code has been fully used.",
    already: "You've already used that code.",
    already_pro: "Your Channel already has Pro.",
    no_channel: "Create your Channel first, then enter the code.",
    throttled: "Too many tries. Wait an hour and try again.",
    login: "Please sign in again.",
    error: "Something went wrong. Try again.",
  };
  const proThrough = ch?.pro_until ? new Date(ch.pro_until).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" }) : null;
  const editable = !ch || ch.status !== "pending";

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="logo">H</span>
          <span>HubLink<span className="pro">Pro</span></span>
        </Link>
        <span className="navemail">{user.email}</span>
        <form action={signOut}>
          <button className="btn-ghost signout" type="submit">Sign out</button>
        </form>
      </nav>
      <div className="page">
        <h1>{ch ? "Your Channel" : "Create your Channel"}</h1>
        <p className="lead">
          Your Channel is your station on HubLinkPro: who you are, what you do, a short commercial,
          and a button that lets neighbors book you.
        </p>

        {sp.error && <p className="note">{ERRORS[sp.error] ?? "Something went wrong."}</p>}
        {sp.saved && <p className="note ok">Saved.</p>}
        {sp.submitted && (
          <p className="note ok">
            Submitted. We&apos;ll verify your Channel and publish it. You&apos;ll keep full control of it.
          </p>
        )}
        {ch && (
          <p className="statuspill">
            {STATUS_TEXT[ch.status]}
            {" · "}
            <Link href={`/channel/${ch.slug}`} style={{ color: "var(--color-brand2)" }}>
              Preview your Channel →
            </Link>
          </p>
        )}

        {ch && ch.status === "live" && (
          <section id="share" className="sharebox" style={{ margin: "8px 0 28px" }}>
            <div>
              <h2 className="dsec" style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}>Share your Channel</h2>
              <p className="lead" style={{ fontSize: 14, marginTop: 0 }}>
                Put this QR code on your truck, yard signs, invoices, or business cards. Scans open your Channel.
              </p>
              <p style={{ fontSize: 14, margin: "0 0 12px", wordBreak: "break-all" }}>
                hublinkpro.com/channel/{ch.slug}
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <ShareChannel url={`https://hublinkpro.com/channel/${ch.slug}`} name={ch.name} />
                <a href={`/channel/${ch.slug}/qr?download=1`} className="btn-ghost">⬇ Download QR</a>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/channel/${ch.slug}/qr`} alt={`QR code for ${ch.name}`} width={132} height={132} className="qrimg" />
          </section>
        )}

        {ch && (
          <section id="bookings" style={{ margin: "8px 0 28px" }}>
            <h2 className="dsec" style={{ borderTop: 0, paddingTop: 0 }}>Booking calendar</h2>
            {sp.cal && CAL_MSG[sp.cal] && <p className={`note ${sp.cal === "saved" || sp.cal === "cancelled" ? "ok" : ""}`}>{CAL_MSG[sp.cal]}</p>}
            <p className="lead" style={{ fontSize: 14 }}>
              Set your hours and neighbors can book a time right on your Channel page. Two people can never book the same slot.
            </p>
            <form action={saveAvailability}>
              <label className="consent">
                <input type="checkbox" name="booking_enabled" defaultChecked={ch.booking_enabled} />
                <span>Take bookings on my Channel page</span>
              </label>
              <div className="field">
                <label htmlFor="cal-slot">Appointment length</label>
                <select id="cal-slot" name="slot_minutes" defaultValue={ch.slot_minutes}>
                  {SLOT_LENGTHS.map((m) => <option key={m} value={m}>{m} minutes</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="cal-tz">Your time zone</label>
                <select id="cal-tz" name="booking_timezone" defaultValue={ch.booking_timezone}>
                  {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="cal-notice">Earliest booking (hours from now)</label>
                <input id="cal-notice" name="booking_notice_hours" type="number" min={0} max={336} defaultValue={ch.booking_notice_hours} />
              </div>
              <div className="field">
                <label htmlFor="cal-window">How far ahead people can book (days)</label>
                <input id="cal-window" name="booking_window_days" type="number" min={1} max={90} defaultValue={ch.booking_window_days} />
              </div>
              <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
                <legend style={{ fontWeight: 600, marginBottom: 8 }}>Your hours</legend>
                {WEEKDAYS.map((name, d) => {
                  const r = ruleByDay.get(d);
                  return (
                    <div key={d} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", margin: "6px 0" }}>
                      <label style={{ width: 120, display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="checkbox" name={`day_${d}`} defaultChecked={!!r} /> {name}
                      </label>
                      <input type="time" name={`start_${d}`} defaultValue={r ? String(r.start_time).slice(0, 5) : "09:00"} aria-label={`${name} start`} />
                      <span>to</span>
                      <input type="time" name={`end_${d}`} defaultValue={r ? String(r.end_time).slice(0, 5) : "17:00"} aria-label={`${name} end`} />
                    </div>
                  );
                })}
              </fieldset>
              <button className="btn-primary" type="submit">Save calendar</button>
            </form>

            <h3 style={{ fontSize: 16, margin: "24px 0 8px" }}>Upcoming bookings</h3>
            {!upcoming?.length ? (
              <p className="lead" style={{ fontSize: 14 }}>
                {ch.booking_enabled ? "Nothing booked yet." : "Turn on bookings above and times show up on your Channel page."}
              </p>
            ) : (
              upcoming.map((b) => (
                <div key={b.id} className="reqrow">
                  <strong>{fmtWhen(b.starts_at, ch.booking_timezone)}</strong> · {b.name} ·{" "}
                  <a href={`tel:${b.phone.replace(/[^0-9+]/g, "")}`} style={{ color: "var(--color-brand2)" }}>{b.phone}</a>
                  {b.email && <> · <a href={`mailto:${b.email}`} style={{ color: "var(--color-brand2)" }}>{b.email}</a></>}
                  <div className="meta">
                    {b.service ? `${b.service} · ` : ""}{b.sms_consent ? "OK to text" : "call or email only"}
                  </div>
                  {b.message && <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{b.message}</p>}
                  <form action={cancelBooking} style={{ marginTop: 10 }}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className="btn-ghost" type="submit">Cancel this booking</button>
                  </form>
                </div>
              ))
            )}
          </section>
        )}

        {ch && (
          <section id="requests" style={{ margin: "8px 0 28px" }}>
            <h2 className="dsec" style={{ borderTop: 0, paddingTop: 0 }}>Booking requests</h2>
            {!requests?.length ? (
              <p className="lead" style={{ fontSize: 14 }}>
                {ch.status === "live"
                  ? "Nothing yet. Requests from your Channel page show up here."
                  : "Once your Channel is live, requests from neighbors show up here."}
              </p>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="reqrow">
                  <strong>{r.name}</strong> · <a href={`tel:${r.phone.replace(/[^0-9+]/g, "")}`} style={{ color: "var(--color-brand2)" }}>{r.phone}</a>
                  {r.email && <> · <a href={`mailto:${r.email}`} style={{ color: "var(--color-brand2)" }}>{r.email}</a></>}
                  <div className="meta">
                    {new Date(r.created_at).toLocaleString("en-US", { timeZone: "America/New_York" })}
                    {r.service ? ` · ${r.service}` : ""}{r.preferred_time ? ` · ${r.preferred_time}` : ""}
                    {r.sms_consent ? " · OK to text" : " · call or email only"}
                  </div>
                  {r.message && <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{r.message}</p>}
                  <form action={setRequestStatus} style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="hidden" name="id" value={r.id} />
                    <select name="status" defaultValue={r.status} style={{ background: "var(--color-ink)", color: "#fff", border: "1px solid var(--color-line)", borderRadius: 8, padding: "6px 10px" }}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="booked">Booked</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button className="btn-ghost" type="submit">Update</button>
                  </form>
                </div>
              ))
            )}
          </section>
        )}

        {ch && (
          <section id="plan" style={{ margin: "8px 0 28px" }}>
            <h2 className="dsec" style={{ borderTop: 0, paddingTop: 0 }}>Your plan</h2>
            {sp.code && CODE_MSG[sp.code] && (
              <p className={`note ${sp.code === "ok" ? "ok" : ""}`}>{CODE_MSG[sp.code]}</p>
            )}
            {ch.tier === "pro" ? (
              <p className="lead" style={{ fontSize: 14, marginTop: 0 }}>
                <span className="statuspill">Pro</span>{" "}
                {proThrough ? `Founding member. Pro features are free through ${proThrough}.` : "All Pro features are on."}
              </p>
            ) : (
              <>
                <p className="lead" style={{ fontSize: 14, marginTop: 0 }}>Free plan. Got a founding-member code? Enter it to unlock Pro.</p>
                <form action={redeemCode} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input name="code" placeholder="Your code" autoCapitalize="characters" autoComplete="off" maxLength={40} aria-label="Founding-member code" style={{ flex: "1 1 180px", background: "var(--color-ink)", color: "#fff", border: "1px solid var(--color-line)", borderRadius: 8, padding: "10px 12px", textTransform: "uppercase" }} />
                  <button className="btn-primary" type="submit">Apply code</button>
                </form>
              </>
            )}
          </section>
        )}

        {ch && (
          <section id="work" style={{ margin: "8px 0 28px" }}>
            <h2 className="dsec" style={{ borderTop: 0, paddingTop: 0 }}>Your work</h2>
            <p className="lead" style={{ fontSize: 14, marginTop: 0 }}>
              Show neighbors jobs you&apos;ve finished. Pick video, photo, or before &amp; after, upload it, and add it.
              {workLimit !== null && ` Free Channels show up to ${workLimit} jobs (${work?.length ?? 0} used).`}
            </p>
            {sp.work && WORK_MSG[sp.work] && (
              <p className={`note ${sp.work === "added" || sp.work === "removed" ? "ok" : ""}`}>{WORK_MSG[sp.work]}</p>
            )}
            <div className="workgrid">
              {(work ?? []).map((w) => (
                <div key={w.id} className="workitem">
                  {w.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.image_url} alt="" />
                  ) : (
                    <video src={`${w.video_url}#t=0.1`} muted playsInline preload="metadata" />
                  )}
                  <div className="workmeta">
                    <strong>{w.title}</strong>
                    {w.video_url && <span className="statuspill">video</span>}
                    {w.before_url && <span className="statuspill">before/after</span>}
                    <form action={deletePortfolioItem}>
                      <input type="hidden" name="id" value={w.id} />
                      <button className="btn-ghost" type="submit">Remove</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
            {workFull ? (
              <p className="lead" style={{ fontSize: 14 }}>You&apos;ve used all {workLimit} free spots. Remove one to add another.</p>
            ) : (
              <WorkAddForm action={addPortfolioItem} userId={user.id} />
            )}
          </section>
        )}

        <form action={saveChannel}>
          {ch && <input type="hidden" name="id" value={ch.id} />}
          <fieldset disabled={!editable} style={{ border: 0, padding: 0, margin: 0 }}>
            <h2 className="dsec">Your look</h2>
            <MediaField name="logo_url" kind="logo" userId={user.id} initial={ch?.logo_url} label="Logo" help="A square photo works best." />
            <MediaField name="hero_image_url" kind="hero" userId={user.id} initial={ch?.hero_image_url} label="Cover photo" help="A wide photo of your best work or your crew." />

            <h2 className="dsec">The basics</h2>
            <div className="field">
              <label>Business name</label>
              <input name="name" required maxLength={100} defaultValue={ch?.name ?? ""} placeholder="Your business name" />
            </div>
            <div className="field">
              <label>Network</label>
              <select name="network_id" defaultValue={ch?.network_id ?? ""}>
                <option value="">Choose a network</option>
                {networks?.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Services (separate with commas)</label>
              <input name="services" defaultValue={ch?.services?.join(", ") ?? ""} placeholder="e.g. Service one, Service two" />
            </div>
            <div className="field">
              <label>One-line tagline (120 characters max)</label>
              <input name="tagline" maxLength={120} defaultValue={ch?.tagline ?? ""} />
            </div>
            <div className="field">
              <label>About your business</label>
              <textarea name="description" rows={5} maxLength={2000} defaultValue={ch?.description ?? ""} />
            </div>
            <h2 className="dsec">Your commercial</h2>
            <MediaField
              name="video_file_url"
              kind="video"
              userId={user.id}
              initial={ch?.video_file_url}
              label="Record or upload a short video"
              help="30–60 seconds is perfect. Tell neighbors who you are and what you do. Up to 50 MB."
            />
            <div className="field">
              <label>Or paste a YouTube or Vimeo link</label>
              <input name="video_url" defaultValue={ch?.video_url ?? ""} placeholder="https://" />
            </div>

            <h2 className="dsec">Reels</h2>
            <div className="field">
              <label>Reels and videos from TikTok, Instagram, Facebook, or YouTube (one link per line, up to 6)</label>
              <textarea name="reels" rows={4} defaultValue={ch?.reels?.join("\n") ?? ""} placeholder="https://www.tiktok.com/@you/video/123..." />
            </div>

            <h2 className="dsec">Find you everywhere</h2>
            {SOCIALS.map((sc) => (
              <div className="field" key={sc.key}>
                <label>{sc.label}</label>
                <input name={`social_${sc.key}`} defaultValue={(ch?.social_links as Record<string, string> | undefined)?.[sc.key] ?? ""} placeholder="https://" />
              </div>
            ))}

            <h2 className="dsec">Booking and contact</h2>
            <div className="field">
              <label>Booking link (your calendar: Google, Calendly, GoHighLevel, etc.)</label>
              <input name="booking_url" defaultValue={ch?.booking_url ?? ""} placeholder="https://" />
            </div>
            <div className="field">
              <label>Phone</label>
              <input name="phone" defaultValue={ch?.phone ?? ""} />
            </div>
            <div className="field">
              <label>Website</label>
              <input name="website" defaultValue={ch?.website ?? ""} placeholder="https://" />
            </div>
            <div className="field">
              <label>City</label>
              <input name="city" defaultValue={ch?.city ?? ""} />
            </div>
            <div className="field">
              <label>ZIP codes you serve (separate with commas)</label>
              <input name="zip_codes" defaultValue={ch?.zip_codes?.join(", ") ?? ""} placeholder="37601, 37604" />
            </div>
            <label className="check">
              <input type="checkbox" name="is_food_truck" defaultChecked={ch?.is_food_truck ?? false} />
              <span>I&apos;m a food truck (always free)</span>
            </label>
            <label className="check">
              <input type="checkbox" name="sms_consent" defaultChecked={ch?.sms_consent ?? false} disabled={ch?.sms_consent} />
              <span>
                I agree to receive text messages from HubLinkPro about my Channel, my leads, and my
                account. Message frequency varies. Message and data rates may apply. Reply STOP to
                opt out, HELP for help. Consent is not a condition of purchase. See our{" "}
                <Link href="/sms" style={{ textDecoration: "underline" }}>SMS terms</Link> and{" "}
                <Link href="/privacy" style={{ textDecoration: "underline" }}>privacy policy</Link>.
              </span>
            </label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
              <button className="btn-ghost" type="submit" name="intent" value="save">Save draft</button>
              {(!ch || ch.status === "draft") && (
                <button className="btn-primary" type="submit" name="intent" value="submit">
                  Submit for review
                </button>
              )}
            </div>
          </fieldset>
        </form>
      </div>
    </>
  );
}
