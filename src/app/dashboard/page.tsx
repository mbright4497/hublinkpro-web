import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { saveChannel, signOut } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Channel | HubLinkPro" };

const ERRORS: Record<string, string> = {
  name: "Add your business name.",
  url: "One of your links doesn't look like a web address.",
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
  const editable = !ch || ch.status !== "pending";

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="logo">H</span>
          HubLink<span className="pro">Pro</span>
        </Link>
        <span style={{ color: "var(--color-muted)", fontSize: 14 }}>{user.email}</span>
        <form action={signOut}>
          <button className="btn-ghost" type="submit">Sign out</button>
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

        <form action={saveChannel}>
          {ch && <input type="hidden" name="id" value={ch.id} />}
          <fieldset disabled={!editable} style={{ border: 0, padding: 0, margin: 0 }}>
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
            <div className="field">
              <label>Commercial video link (YouTube or Vimeo)</label>
              <input name="video_url" defaultValue={ch?.video_url ?? ""} placeholder="https://" />
            </div>
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
