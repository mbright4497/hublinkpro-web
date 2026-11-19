import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ADMIN_EMAIL } from "@/lib/supabase/env";
import { emailSetup } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Channel activity | HubLinkPro", robots: { index: false } };

type Item = { at: string; kind: string; title: string; detail?: string; bad?: boolean };

const when = (d: string) =>
  new Date(d).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function ChannelActivity({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cid = Number(id);
  if (!Number.isInteger(cid)) notFound();
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) notFound();
  // Admin is confirmed above, so reading across tables with the service role is safe here.
  const db = supabaseAdmin();
  if (!db) return <div className="page"><p className="lead">SUPABASE_SERVICE_ROLE_KEY is not set, so activity can't load.</p></div>;

  const { data: ch } = await db.from("channels").select("id,name,slug,status,owner_id,created_at").eq("id", cid).maybeSingle();
  if (!ch) notFound();

  const [msgs, books, reqs, calls, sos, nudges, userMsgs] = await Promise.all([
    db.from("message_log").select("medium,label,to_addr,subject,body,ok,created_at").eq("channel_id", cid).order("created_at", { ascending: false }).limit(100),
    db.from("bookings").select("name,phone,service,starts_at,status,created_at").eq("channel_id", cid).order("created_at", { ascending: false }).limit(100),
    db.from("booking_requests").select("name,phone,service,message,status,created_at").eq("channel_id", cid).order("created_at", { ascending: false }).limit(100),
    db.from("call_logs").select("from_number,status,duration_seconds,texted,created_at").eq("channel_id", cid).order("created_at", { ascending: false }).limit(100),
    db.from("sos_dispatches").select("method,wave,response,sent_at").eq("channel_id", cid).order("sent_at", { ascending: false }).limit(100),
    db.from("signup_nudges").select("kind,created_at").eq("user_id", ch.owner_id),
    db.from("message_log").select("label,to_addr,subject,body,ok,created_at").eq("user_id", ch.owner_id).order("created_at", { ascending: false }).limit(50),
  ]);

  const items: Item[] = [];
  for (const m of msgs.data ?? []) items.push({ at: m.created_at, kind: m.medium === "sms" ? "Text" : "Email", title: `${m.label} → ${m.to_addr}`, detail: [m.subject, m.body].filter(Boolean).join("\n\n"), bad: !m.ok });
  for (const m of userMsgs.data ?? []) items.push({ at: m.created_at, kind: "Email", title: `${m.label} → ${m.to_addr}`, detail: [m.subject, m.body].filter(Boolean).join("\n\n"), bad: !m.ok });
  const loggedNudges = new Set((userMsgs.data ?? []).map((m) => m.label));
  for (const n of nudges.data ?? []) {
    if (n.kind === "optout") items.push({ at: n.created_at, kind: "Email", title: "Owner opted out of reminder emails" });
    else if (!loggedNudges.has(`Signup nudge (${n.kind})`)) items.push({ at: n.created_at, kind: "Email", title: `Signup nudge (${n.kind}) sent to owner` });
  }
  for (const b of books.data ?? []) items.push({ at: b.created_at, kind: "Booking", title: `${b.name} booked ${when(b.starts_at)} (${b.status})`, detail: [b.phone, b.service].filter(Boolean).join(" · ") });
  for (const r of reqs.data ?? []) items.push({ at: r.created_at, kind: "Request", title: `${r.name} sent a request (${r.status})`, detail: [r.phone, r.service, r.message].filter(Boolean).join("\n") });
  for (const c of calls.data ?? []) items.push({ at: c.created_at, kind: "Call", title: `Call from ${c.from_number ?? "unknown"}: ${c.status}${c.duration_seconds ? `, ${c.duration_seconds}s` : ""}${c.texted ? ", text-back sent" : ""}`, bad: c.status === "missed" || c.status === "failed" });
  for (const d of sos.data ?? []) items.push({ at: d.sent_at, kind: "SOS", title: `SOS ${d.method} (wave ${d.wave}): ${d.response}` });
  items.sort((a, b) => +new Date(b.at) - +new Date(a.at));

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand"><span className="logo">H</span><span>HubLink<span className="pro">Pro</span></span></Link>
        <Link href="/admin">← Admin</Link>
        <span />
      </nav>
      <div className="page" style={{ maxWidth: 800 }}>
        <h1>{ch.name}</h1>
        <p className="lead" style={{ fontSize: 14, marginTop: 0 }}>
          {ch.status} · {ch.slug && <Link href={`/channel/${ch.slug}`}>/channel/{ch.slug}</Link>} · {items.length} item{items.length === 1 ? "" : "s"}.
          Emails and texts sent before {when("2026-11-19T12:00:00Z")} weren&apos;t logged, so older ones may be missing.
        </p>
        <form action={emailSetup} style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 18px" }}>
          <input type="hidden" name="id" value={ch.id} />
          <input name="first_name" placeholder="Owner's first name" aria-label="Owner's first name" style={{ width: 170 }} />
          <button className="btn-primary" type="submit">Email: you&apos;re set up</button>
        </form>
        {items.length === 0 && <p className="lead">Nothing yet for this Channel.</p>}
        {items.map((it, i) => (
          <div key={i} className="autocard" style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 15 }}>
              <span className="statuspill" style={{ marginRight: 8 }}>{it.kind}</span>{it.title}
              {it.bad && <span className="statuspill" style={{ marginLeft: 8 }}>failed</span>}
            </h3>
            <p style={{ color: "var(--color-muted)", fontSize: 13, margin: "4px 0" }}>{when(it.at)}</p>
            {it.detail && (
              <details>
                <summary style={{ cursor: "pointer", fontSize: 13 }}>Show message</summary>
                <p style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{it.detail}</p>
              </details>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
