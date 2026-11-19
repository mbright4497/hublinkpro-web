import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { addLead, setLeadStatus } from "./actions";
import {
  LEAD_COLUMNS,
  OPEN_STATUSES,
  SOURCES,
  STATUSES,
  ago,
  dollars,
  fmtPhone,
  followUp,
  isDue,
  leadTitle,
  nextStatus,
  phoneDigits,
  smsHref,
  statusLabel,
  telHref,
  todayIn,
  type Lead,
} from "@/lib/crm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your leads | HubLinkPro" };

const MSG: Record<string, string> = {
  name: "Add a name for the lead.",
  phone: "That phone number looks too short.",
  email: "That email address doesn't look right.",
  save: "We couldn't save that. Try again.",
  limit: "You've reached the 2,000-lead limit for one Channel. Delete old leads or export them first.",
};

function Card({ l, today, back }: { l: Lead; today: string; back: string }) {
  const f = followUp(l.follow_up_on, today);
  const next = nextStatus(l.status);
  return (
    <div className="crm-card" id={`lead-${l.id}`}>
      <Link href={`/dashboard/crm/${l.id}`} className="crm-card-main">
        <strong>{leadTitle(l)}</strong>
        {l.service && <span className="crm-svc">{l.service}</span>}
        <span className="crm-meta">
          {SOURCES[l.source] ?? l.source} · {ago(l.last_activity_at)}
          {l.value_cents ? ` · ${dollars(l.value_cents)}` : ""}
        </span>
        {f && OPEN_STATUSES.includes(l.status) && <span className={`crm-flag ${f.tone}`}>{f.text}</span>}
      </Link>
      <div className="crm-card-acts">
        {l.phone && (
          <>
            <a className="crm-btn sm" href={telHref(l.phone)} aria-label={`Call ${leadTitle(l)}`}>Call</a>
            <a className="crm-btn sm" href={smsHref(l.phone)} aria-label={`Text ${leadTitle(l)}`}>Text</a>
          </>
        )}
        {next && (
          <form action={setLeadStatus}>
            <input type="hidden" name="id" value={l.id} />
            <input type="hidden" name="status" value={next} />
            <input type="hidden" name="back" value={`${back}#lead-${l.id}`} />
            <button className="crm-btn sm go" type="submit" aria-label={`Move ${leadTitle(l)} to ${statusLabel(next)}`}>
              {statusLabel(next)} →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ch } = await supabase
    .from("channels")
    .select("id,name,slug,status,booking_timezone")
    .eq("owner_id", user.id)
    .order("id")
    .limit(1)
    .maybeSingle();
  if (!ch) redirect("/dashboard");

  const { data } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("channel_id", ch.id)
    .order("last_activity_at", { ascending: false })
    .limit(2000);
  const all = (data ?? []) as Lead[];
  const today = todayIn(ch.booking_timezone);

  // Search and filter (the stats above always use every lead).
  const q = (sp.q ?? "").trim().slice(0, 80);
  const ql = q.toLowerCase();
  const qd = phoneDigits(q);
  const source = sp.source && SOURCES[sp.source] ? sp.source : "";
  const view = sp.view === "list" ? "list" : "board";
  const leads = all.filter(
    (l) =>
      (!source || l.source === source) &&
      (!q ||
        l.name.toLowerCase().includes(ql) ||
        (l.email ?? "").toLowerCase().includes(ql) ||
        (l.service ?? "").toLowerCase().includes(ql) ||
        (qd.length >= 3 && phoneDigits(l.phone).includes(qd))),
  );

  // The numbers at the top.
  const newCount = all.filter((l) => l.status === "new").length;
  const dueCount = all.filter((l) => isDue(l, today)).length;
  const inFlight = all.filter((l) => ["contacted", "quoted", "booked"].includes(l.status)).length;
  const monthAgo = Date.now() - 30 * 86400000;
  const wonRecent = all.filter((l) => l.status === "won" && Date.parse(l.last_activity_at) >= monthAgo);
  const wonValue = wonRecent.reduce((n, l) => n + (l.value_cents ?? 0), 0);

  // "Do this next": follow-ups that are due first, then brand-new leads nobody has touched.
  const queue = [
    ...all.filter((l) => isDue(l, today)).sort((a, b) => (a.follow_up_on ?? "").localeCompare(b.follow_up_on ?? "")),
    ...all.filter((l) => l.status === "new" && !isDue(l, today)),
  ].slice(0, 6);

  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (source) p.set("source", source);
    if (view === "list") p.set("view", "list");
    for (const [k, v] of Object.entries(extra)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const s = p.toString();
    return s ? `/dashboard/crm?${s}` : "/dashboard/crm";
  };
  const here = qs({});

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

      <main className="crm">
        <p style={{ margin: "0 0 14px" }}>
          <Link href="/dashboard" style={{ color: "var(--color-brand2)", fontWeight: 700, fontSize: 14 }}>← Your Channel</Link>
        </p>
        <div className="crm-top">
          <div>
            <h1>Your leads</h1>
            <p className="sub">
              Everyone who books, asks, or calls lands here on their own. Free, and it&apos;s yours to keep.
            </p>
          </div>
          <div className="acts">
            {all.length > 0 && (
              <a className="crm-btn" href="/dashboard/crm/export" download>Export to spreadsheet</a>
            )}
            <a className="crm-btn primary" href="#add">+ Add a lead</a>
          </div>
        </div>

        {sp.error && <p className="note">{MSG[sp.error] ?? "Something went wrong."}</p>}
        {sp.deleted && <p className="note ok">Lead deleted.</p>}

        {all.length === 0 ? (
          <div className="crm-empty">
            <h2>Your first lead is on its way.</h2>
            <p>
              The moment someone books a time, sends a request, or calls your tracking number, they show up here
              with the whole story: who they are, what they asked for, and when. No typing.
            </p>
            <p>You can also add someone yourself, like a customer from a text or a referral.</p>
            <div className="crm-empty-acts">
              <a className="crm-btn primary" href="#add">+ Add a lead</a>
              {ch.status === "live" && (
                <Link className="crm-btn" href={`/channel/${ch.slug}`}>See your Channel</Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="crm-stats">
              <div className="crm-stat">
                <b style={{ color: "#60a5fa" }}>{newCount}</b>
                <span>New</span>
              </div>
              <div className={`crm-stat${dueCount ? " hot" : ""}`}>
                <b style={{ color: dueCount ? "#fb923c" : undefined }}>{dueCount}</b>
                <span>Follow-ups due</span>
              </div>
              <div className="crm-stat">
                <b style={{ color: "#34d399" }}>{inFlight}</b>
                <span>In progress</span>
              </div>
              <div className="crm-stat">
                <b style={{ color: "#22c55e" }}>{wonRecent.length}</b>
                <span>Won, last 30 days{wonValue ? ` · ${dollars(wonValue)}` : ""}</span>
              </div>
            </div>

            {queue.length > 0 && (
              <section className="crm-next" aria-labelledby="crm-next-h">
                <h2 id="crm-next-h">Do this next</h2>
                {queue.map((l) => {
                  const f = followUp(l.follow_up_on, today);
                  const due = isDue(l, today);
                  return (
                    <div className="crm-nextrow" key={l.id}>
                      <Link href={`/dashboard/crm/${l.id}`} className="who">
                        <strong>{leadTitle(l)}</strong>
                        <span className={`crm-flag ${due && f ? f.tone : "today"}`}>
                          {due && f ? f.text : `New · ${ago(l.created_at)}`}
                        </span>
                        {l.service && <span className="crm-meta">{l.service}</span>}
                      </Link>
                      <div className="crm-card-acts">
                        {l.phone && <a className="crm-btn sm" href={telHref(l.phone)}>Call</a>}
                        {l.phone && <a className="crm-btn sm" href={smsHref(l.phone)}>Text</a>}
                        {l.email && !l.phone && <a className="crm-btn sm" href={`mailto:${l.email}`}>Email</a>}
                        {l.status === "new" && (
                          <form action={setLeadStatus}>
                            <input type="hidden" name="id" value={l.id} />
                            <input type="hidden" name="status" value="contacted" />
                            <input type="hidden" name="back" value={here} />
                            <button className="crm-btn sm go" type="submit">Mark contacted</button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            <div className="crm-tools">
              <form method="get" action="/dashboard/crm" className="crm-search" role="search">
                {view === "list" && <input type="hidden" name="view" value="list" />}
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search name, phone, email, or job"
                  aria-label="Search leads"
                />
                <select name="source" defaultValue={source} aria-label="Filter by source">
                  <option value="">All sources</option>
                  {Object.entries(SOURCES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button className="crm-btn" type="submit">Search</button>
                {(q || source) && <Link className="crm-btn" href={qs({ q: "", source: "" })}>Clear</Link>}
              </form>
              <div className="crm-seg" role="group" aria-label="View">
                <Link href={qs({ view: "" })} className={view === "board" ? "on" : ""} aria-current={view === "board" ? "page" : undefined}>Board</Link>
                <Link href={qs({ view: "list" })} className={view === "list" ? "on" : ""} aria-current={view === "list" ? "page" : undefined}>List</Link>
              </div>
            </div>

            {leads.length === 0 ? (
              <p className="sub">No leads match that search.</p>
            ) : view === "board" ? (
              <div className="crm-board">
                {STATUSES.map((s) => {
                  const col = leads.filter((l) => l.status === s.key);
                  const closed = s.key === "won" || s.key === "lost";
                  const shown = closed ? col.slice(0, 15) : col;
                  return (
                    <section className="crm-col" key={s.key} aria-label={s.label}>
                      <h3>
                        <i style={{ background: s.color }} />
                        {s.label}
                        <span>{col.length}</span>
                      </h3>
                      {shown.length === 0 && <p className="crm-colempty">Nothing here</p>}
                      {shown.map((l) => (
                        <Card key={l.id} l={l} today={today} back={here} />
                      ))}
                      {col.length > shown.length && (
                        <Link className="crm-more" href={qs({ view: "list" })}>
                          + {col.length - shown.length} more in the list
                        </Link>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="crm-list">
                {leads.map((l) => {
                  const f = followUp(l.follow_up_on, today);
                  return (
                    <Link href={`/dashboard/crm/${l.id}`} className="crm-row" key={l.id}>
                      <span className="pill" style={{ borderColor: STATUSES.find((s) => s.key === l.status)?.color }}>
                        {statusLabel(l.status)}
                      </span>
                      <span className="nm">
                        <strong>{leadTitle(l)}</strong>
                        <small>
                          {[l.service, l.phone ? fmtPhone(l.phone) : l.email].filter(Boolean).join(" · ")}
                        </small>
                      </span>
                      <span className="rt">
                        {f && OPEN_STATUSES.includes(l.status) && <em className={`crm-flag ${f.tone}`}>{f.text}</em>}
                        <small>{SOURCES[l.source] ?? l.source} · {ago(l.last_activity_at)}</small>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        <details className="crm-add" id="add" open={!!sp.error && !sp.deleted}>
          <summary>+ Add a lead by hand</summary>
          <form action={addLead} className="crm-addform">
            <div className="field">
              <label htmlFor="al-name">Name</label>
              <input id="al-name" name="name" required maxLength={120} autoComplete="off" />
            </div>
            <div className="crm-two">
              <div className="field">
                <label htmlFor="al-phone">Phone</label>
                <input id="al-phone" name="phone" type="tel" inputMode="tel" maxLength={30} autoComplete="off" />
              </div>
              <div className="field">
                <label htmlFor="al-email">Email</label>
                <input id="al-email" name="email" type="email" maxLength={200} autoComplete="off" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="al-svc">What do they need?</label>
              <input id="al-svc" name="service" maxLength={120} autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="al-note">Note (optional)</label>
              <textarea id="al-note" name="note" rows={3} maxLength={2000} />
            </div>
            <button className="crm-btn primary" type="submit">Save lead</button>
          </form>
        </details>
      </main>
    </>
  );
}
