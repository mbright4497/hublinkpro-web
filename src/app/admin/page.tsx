import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/supabase/env";
import { setChannelStatus, markMessageRead, saveNote, createCode, setCodeActive } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | HubLinkPro", robots: { index: false } };

type Signup = {
  user_id: string; email: string; signed_up_at: string; last_sign_in_at: string | null;
  channel_id: number | null; slug: string | null; name: string | null; status: string | null;
  tier: string | null; city: string | null; network_name: string | null; phone: string | null;
  sms_consent: boolean | null; has_video: boolean | null; has_logo: boolean | null;
  service_count: number | null; channel_created_at: string | null; note: string;
  pro_until: string | null; comp_code: string | null;
};
const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Needs review" },
  { key: "incomplete", label: "Incomplete" },
  { key: "live", label: "Live" },
  { key: "paused", label: "Paused" },
] as const;
const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" }) : "—";
function bucket(s: Signup) {
  if (!s.channel_id) return "incomplete"; // signed up, no Channel started
  if (s.status === "draft") return "incomplete";
  return s.status ?? "incomplete";
}
function missing(s: Signup) {
  if (!s.channel_id) return ["Channel not started"];
  const m: string[] = [];
  if (!s.name) m.push("name");
  if (!s.network_name) m.push("Network");
  if (!s.phone) m.push("phone");
  if (!s.service_count) m.push("services");
  if (!s.has_logo) m.push("logo");
  if (!s.has_video) m.push("video");
  return m;
}

export default async function Admin({ searchParams }: { searchParams: Promise<{ f?: string; q?: string; code?: string; c?: string }> }) {
  const { f = "all", q = "", code: codeMsg = "", c: newCode = "" } = await searchParams;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) notFound();

  const { data: signupData } = await supabase.rpc("admin_signups");
  const signups = (signupData ?? []) as Signup[];
  const counts: Record<string, number> = { all: signups.length };
  for (const s of signups) counts[bucket(s)] = (counts[bucket(s)] ?? 0) + 1;
  const needle = q.trim().toLowerCase();
  const shown = signups.filter((s) => {
    if (f !== "all" && bucket(s) !== f) return false;
    if (!needle) return true;
    return [s.email, s.name, s.city, s.network_name, s.phone].some((v) => (v ?? "").toLowerCase().includes(needle));
  });

  const { data: messages } = await supabase
    .from("contact_messages")
    .select("id,name,email,message,source_path,read,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const { data: codes } = await supabase.from("promo_codes").select("id,code,label,months,max_uses,uses,expires_at,active").order("id", { ascending: false });
  const unread = (messages ?? []).filter((m) => !m.read).length;
  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand"><span className="logo">H</span><span>HubLink<span className="pro">Pro</span></span></Link>
        <span style={{ color: "var(--color-muted)" }}>Admin · {signups.length} signups</span>
        <span />
      </nav>
      <div className="page" style={{ maxWidth: 900 }}>
        <h1>Founding codes</h1>
        <p className="lead" style={{ fontSize: 14, marginTop: 0 }}>Give a friend a code. They enter it on their dashboard and get Pro free for the months you set. It returns to Free on its own when the time is up.</p>
        {codeMsg === "made" && <p className="note ok">Code created: <strong>{newCode}</strong></p>}
        {codeMsg === "dup" && <p className="note">That code already exists. Pick another.</p>}
        {codeMsg === "short" && <p className="note">Codes need at least 4 characters.</p>}
        {codeMsg === "error" && <p className="note">Couldn&apos;t create the code. Try again.</p>}
        <form action={createCode} className="autocard" style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 12 }}>
          <label>Who it&apos;s for<input name="label" maxLength={120} placeholder="Joe, Reliable Paving" /></label>
          <label>Code (blank = random)<input name="code" maxLength={40} placeholder="FOUNDER" style={{ textTransform: "uppercase" }} /></label>
          <label>Free months<input name="months" type="number" min={1} max={60} defaultValue={12} /></label>
          <label>Max uses<input name="max_uses" type="number" min={1} max={1000} defaultValue={10} /></label>
          <label>Code expires (optional)<input name="expires" type="date" /></label>
          <div style={{ display: "flex", alignItems: "end" }}><button className="btn-primary" type="submit">Create code</button></div>
        </form>
        {(codes ?? []).map((cd) => (
          <div key={cd.id} className="autocard" style={{ marginBottom: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between", opacity: cd.active ? 1 : 0.55 }}>
            <div>
              <strong style={{ letterSpacing: 1 }}>{cd.code}</strong>
              <span className="statuspill" style={{ marginLeft: 8 }}>{cd.uses}/{cd.max_uses} used</span>
              {!cd.active && <span className="statuspill" style={{ marginLeft: 6 }}>off</span>}
              <br /><span style={{ color: "var(--color-muted)", fontSize: 13 }}>{cd.label || "No label"} · {cd.months} months{cd.expires_at ? ` · code expires ${fmt(cd.expires_at)}` : ""}</span>
            </div>
            <form action={setCodeActive}>
              <input type="hidden" name="id" value={cd.id} />
              <input type="hidden" name="active" value={cd.active ? "0" : "1"} />
              <button className="btn-ghost" type="submit">{cd.active ? "Turn off" : "Turn on"}</button>
            </form>
          </div>
        ))}
        {!(codes ?? []).length && <p className="lead" style={{ fontSize: 14 }}>No codes yet.</p>}

        <h1 style={{ marginTop: 32 }}>Signups</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
          {FILTERS.map((x) => (
            <Link
              key={x.key}
              href={`/admin?f=${x.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={f === x.key ? "btn-primary" : "btn-ghost"}
            >
              {x.label} ({counts[x.key] ?? 0})
            </Link>
          ))}
        </div>
        <form method="get" style={{ marginBottom: 16 }}>
          <input type="hidden" name="f" value={f} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search email, business, city, Network, phone"
            style={{ width: "100%", background: "var(--color-ink)", color: "#fff", border: "1px solid var(--color-line)", borderRadius: 8, padding: "10px 12px" }}
          />
        </form>
        {shown.length === 0 && <p className="lead">No signups match.</p>}
        {shown.map((s) => {
          const miss = missing(s);
          return (
            <div key={s.user_id} className="autocard" style={{ marginBottom: 14 }}>
              <h3>
                {s.name ?? s.email}
                <span className="statuspill" style={{ marginLeft: 8 }}>{s.channel_id ? (s.status === "draft" ? "draft" : s.status) : "no channel"}</span>
                {s.tier === "pro" && <span className="statuspill" style={{ marginLeft: 6 }}>pro</span>}
                {s.comp_code && <span className="statuspill" style={{ marginLeft: 6 }}>{s.comp_code} · through {fmt(s.pro_until)}</span>}
              </h3>
              <p>
                <a href={`mailto:${s.email}`}>{s.email}</a>{s.phone ? <> · <a href={`tel:${s.phone}`}>{s.phone}</a></> : null}
                <br />{s.network_name ?? "No Network"} · {s.city ?? "no city"} · SMS consent: {s.sms_consent ? "yes" : "no"}
                <br />Signed up {fmt(s.signed_up_at)} · Last sign-in {fmt(s.last_sign_in_at)}
                {miss.length > 0 && <><br />Missing: {miss.join(", ")}</>}
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                {s.slug && <Link href={`/channel/${s.slug}`} className="btn-ghost">Preview</Link>}
                {s.channel_id && s.status !== "live" && (
                  <form action={setChannelStatus}>
                    <input type="hidden" name="id" value={s.channel_id} />
                    <input type="hidden" name="status" value="live" />
                    <button className="btn-primary" type="submit">Approve &amp; publish</button>
                  </form>
                )}
                {s.channel_id && s.status === "live" && (
                  <form action={setChannelStatus}>
                    <input type="hidden" name="id" value={s.channel_id} />
                    <input type="hidden" name="status" value="paused" />
                    <button className="btn-ghost" type="submit">Pause</button>
                  </form>
                )}
                {s.channel_id && s.status !== "paused" && s.status !== "live" && (
                  <form action={setChannelStatus}>
                    <input type="hidden" name="id" value={s.channel_id} />
                    <input type="hidden" name="status" value="paused" />
                    <button className="btn-ghost" type="submit">Reject / pause</button>
                  </form>
                )}
              </div>
              <form action={saveNote} style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <input type="hidden" name="user_id" value={s.user_id} />
                <input
                  name="note"
                  defaultValue={s.note}
                  maxLength={2000}
                  placeholder="Private note (only you see this)"
                  style={{ flex: 1, background: "var(--color-ink)", color: "#fff", border: "1px solid var(--color-line)", borderRadius: 8, padding: "8px 10px" }}
                />
                <button className="btn-ghost" type="submit">Save note</button>
              </form>
            </div>
          );
        })}

        <h1 style={{ marginTop: 40 }}>Inbox{unread > 0 ? ` (${unread} new)` : ""}</h1>
        {(messages ?? []).length === 0 && <p className="lead">No messages yet.</p>}
        {(messages ?? []).map((m) => (
          <div key={m.id} className="autocard" style={{ marginBottom: 14, opacity: m.read ? 0.6 : 1 }}>
            <h3>{m.name} {!m.read && <span className="statuspill" style={{ marginLeft: 8 }}>new</span>}</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{m.message}</p>
            <p>
              <a href={`mailto:${m.email}`}>{m.email}</a> · {new Date(m.created_at).toLocaleString("en-US", { timeZone: "America/New_York" })}
            </p>
            {!m.read && (
              <form action={markMessageRead} style={{ marginTop: 10 }}>
                <input type="hidden" name="id" value={m.id} />
                <button className="btn-ghost" type="submit">Mark read</button>
              </form>
            )}
          </div>
        ))}

      </div>
    </>
  );
}
