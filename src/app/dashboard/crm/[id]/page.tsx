import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { signOut } from "../../actions";
import { addNote, deleteLead, saveLead, setFollowUp, setLeadStatus } from "../actions";
import { fmtWhen } from "@/lib/booking";
import {
  LEAD_COLUMNS,
  OPEN_STATUSES,
  SOURCES,
  STATUSES,
  ago,
  fmtPhone,
  followUp,
  leadTitle,
  smsHref,
  statusColor,
  statusLabel,
  telHref,
  todayIn,
  type Lead,
  type LeadEvent,
} from "@/lib/crm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lead | HubLinkPro" };

const MSG: Record<string, string> = {
  name: "Add a name.",
  phone: "That phone number looks too short.",
  email: "That email address doesn't look right.",
  value: "Enter the job amount as a number, like 1250.",
  dup: "Another lead already uses that phone number.",
  save: "We couldn't save that. Try again.",
};

const ICON: Record<string, string> = {
  created: "✦",
  note: "✎",
  status: "➜",
  call: "☎",
  booking: "📅",
  request: "✉",
  follow_up: "⏰",
  edit: "✎",
};

export default async function LeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id: idRaw } = await params;
  const sp = await searchParams;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) notFound();

  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ch } = await supabase
    .from("channels")
    .select("id,booking_timezone")
    .eq("owner_id", user.id)
    .order("id")
    .limit(1)
    .maybeSingle();
  if (!ch) redirect("/dashboard");

  const { data: row } = await supabase.from("leads").select(LEAD_COLUMNS).eq("id", id).eq("channel_id", ch.id).maybeSingle();
  if (!row) notFound();
  const lead = row as Lead;

  const { data: ev } = await supabase
    .from("lead_events")
    .select("id,kind,body,created_at")
    .eq("lead_id", id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(200);
  const events = (ev ?? []) as LeadEvent[];

  const tz = ch.booking_timezone;
  const today = todayIn(tz);
  const f = followUp(lead.follow_up_on, today);
  const open = OPEN_STATUSES.includes(lead.status);
  const here = `/dashboard/crm/${id}`;

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

      <main className="crm crm-detail">
        <p style={{ margin: "0 0 14px" }}>
          <Link href="/dashboard/crm" style={{ color: "var(--color-brand2)", fontWeight: 700, fontSize: 14 }}>← All leads</Link>
        </p>

        {sp.error && <p className="note">{MSG[sp.error] ?? "Something went wrong."}</p>}
        {sp.saved && <p className="note ok">Saved.</p>}
        {sp.added && <p className="note ok">Lead added.</p>}
        {sp.dup && <p className="note">You already had this person, so here they are.</p>}

        <header className="crm-dhead">
          <div>
            <h1>{leadTitle(lead)}</h1>
            <p className="sub" style={{ margin: 0 }}>
              {SOURCES[lead.source] ?? lead.source} · first heard from {ago(lead.created_at)}
              {lead.service ? ` · ${lead.service}` : ""}
            </p>
          </div>
          <div className="acts">
            {lead.phone && <a className="crm-btn primary" href={telHref(lead.phone)}>Call {fmtPhone(lead.phone)}</a>}
            {lead.phone && <a className="crm-btn" href={smsHref(lead.phone)}>Text</a>}
            {lead.email && <a className="crm-btn" href={`mailto:${lead.email}`}>Email</a>}
          </div>
        </header>

        <section aria-label="Stage" className="crm-block">
          <h2>Where are they?</h2>
          <div className="crm-stepper" role="group" aria-label="Move this lead to a stage">
            {STATUSES.map((s) => (
              <form action={setLeadStatus} key={s.key}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value={s.key} />
                <input type="hidden" name="back" value={here} />
                <button
                  type="submit"
                  className={`step${lead.status === s.key ? " on" : ""}`}
                  style={lead.status === s.key ? { background: s.color, borderColor: s.color } : undefined}
                  aria-pressed={lead.status === s.key}
                >
                  {s.label}
                </button>
              </form>
            ))}
          </div>
        </section>

        {open && (
          <section aria-label="Follow-up" className="crm-block">
            <h2>Follow-up</h2>
            {f ? (
              <p className={`crm-flag big ${f.tone}`}>{f.text}</p>
            ) : (
              <p className="sub" style={{ margin: "0 0 10px" }}>No follow-up set. Pick a day and it&apos;ll show up in &ldquo;Do this next.&rdquo;</p>
            )}
            <div className="crm-follow">
              {[
                ["tomorrow", "Tomorrow"],
                ["3", "In 3 days"],
                ["7", "Next week"],
              ].map(([w, label]) => (
                <form action={setFollowUp} key={w}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="when" value={w} />
                  <input type="hidden" name="back" value={here} />
                  <button className="crm-btn sm" type="submit">{label}</button>
                </form>
              ))}
              <form action={setFollowUp} className="crm-datepick">
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="when" value="date" />
                <input type="hidden" name="back" value={here} />
                <input type="date" name="date" min={today} defaultValue={lead.follow_up_on ?? ""} aria-label="Pick a follow-up day" required />
                <button className="crm-btn sm" type="submit">Set</button>
              </form>
              {lead.follow_up_on && (
                <form action={setFollowUp}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="when" value="clear" />
                  <input type="hidden" name="back" value={here} />
                  <button className="crm-btn sm" type="submit">Clear</button>
                </form>
              )}
            </div>
          </section>
        )}

        <section aria-label="Notes" className="crm-block" id="timeline">
          <h2>Notes &amp; history</h2>
          <form action={addNote} className="crm-noteform">
            <input type="hidden" name="id" value={id} />
            <label htmlFor="note-body" className="sr">Add a note</label>
            <textarea id="note-body" name="body" rows={3} maxLength={2000} placeholder="What did you talk about? Quote, gate code, dog in the yard…" required />
            <button className="crm-btn primary" type="submit">Add note</button>
          </form>
          <ol className="crm-timeline">
            {events.map((e) => (
              <li key={e.id} className={e.kind}>
                <span className="ic" aria-hidden="true">{ICON[e.kind] ?? "•"}</span>
                <div>
                  {e.body && <p>{e.body}</p>}
                  <small title={fmtWhen(e.created_at, tz)}>{ago(e.created_at)} · {fmtWhen(e.created_at, tz)}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Details" className="crm-block">
          <h2>Details</h2>
          <form action={saveLead} className="crm-addform">
            <input type="hidden" name="id" value={id} />
            <div className="field">
              <label htmlFor="d-name">Name</label>
              <input id="d-name" name="name" defaultValue={lead.name === lead.phone ? "" : lead.name} placeholder={leadTitle(lead)} required maxLength={120} />
            </div>
            <div className="crm-two">
              <div className="field">
                <label htmlFor="d-phone">Phone</label>
                <input id="d-phone" name="phone" type="tel" inputMode="tel" defaultValue={lead.phone ?? ""} maxLength={30} />
              </div>
              <div className="field">
                <label htmlFor="d-email">Email</label>
                <input id="d-email" name="email" type="email" defaultValue={lead.email ?? ""} maxLength={200} />
              </div>
            </div>
            <div className="crm-two">
              <div className="field">
                <label htmlFor="d-svc">What do they need?</label>
                <input id="d-svc" name="service" defaultValue={lead.service ?? ""} maxLength={120} />
              </div>
              <div className="field">
                <label htmlFor="d-val">Job amount ($)</label>
                <input id="d-val" name="value" inputMode="decimal" defaultValue={lead.value_cents != null ? (lead.value_cents / 100).toString() : ""} placeholder="e.g. 1250" />
              </div>
            </div>
            <button className="crm-btn primary" type="submit">Save details</button>
          </form>
        </section>

        <details className="crm-danger">
          <summary>Delete this lead</summary>
          <p>This removes {leadTitle(lead)} and their whole history. It can&apos;t be undone.</p>
          <form action={deleteLead}>
            <input type="hidden" name="id" value={id} />
            <button className="crm-btn danger" type="submit">Yes, delete this lead</button>
          </form>
        </details>
        <p className="crm-foot" style={{ color: statusColor(lead.status) }}>
          Currently: {statusLabel(lead.status)}
        </p>
      </main>
    </>
  );
}
