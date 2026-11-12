import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/supabase/env";
import { setChannelStatus, markMessageRead } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin | HubLinkPro", robots: { index: false } };

export default async function Admin() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) notFound();

  const { data: channels } = await supabase
    .from("channels")
    .select("id,slug,name,status,phone,website,booking_url,video_url,city,zip_codes,services,sms_consent,created_at,networks(name)")
    .order("created_at", { ascending: false });
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("id,name,email,message,source_path,read,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const unread = (messages ?? []).filter((m) => !m.read).length;
  const order = { pending: 0, draft: 1, live: 2, paused: 3 } as Record<string, number>;
  const sorted = [...(channels ?? [])].sort((a, b) => order[a.status] - order[b.status]);

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand"><span className="logo">H</span><span>HubLink<span className="pro">Pro</span></span></Link>
        <span style={{ color: "var(--color-muted)" }}>Admin · {sorted.length} Channels</span>
        <span />
      </nav>
      <div className="page" style={{ maxWidth: 900 }}>
        <h1>Inbox{unread > 0 ? ` (${unread} new)` : ""}</h1>
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

        <h1 style={{ marginTop: 40 }}>Channels</h1>
        {sorted.length === 0 && <p className="lead">No Channels yet.</p>}
        {sorted.map((c) => {
          const net = Array.isArray(c.networks) ? c.networks[0] : c.networks;
          return (
            <div key={c.id} className="autocard" style={{ marginBottom: 14 }}>
              <h3>{c.name} <span className="statuspill" style={{ marginLeft: 8 }}>{c.status}</span></h3>
              <p>
                {net?.name ?? "No network"} · {c.city ?? "no city"} · {c.zip_codes?.join(", ") || "no ZIPs"}
                <br />Services: {c.services?.join(", ") || "none listed"}
                <br />Phone: {c.phone ?? "—"} · SMS consent: {c.sms_consent ? "yes" : "no"}
                <br />Booking: {c.booking_url ?? "—"} · Video: {c.video_url ?? "—"} · Site: {c.website ?? "—"}
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <Link href={`/channel/${c.slug}`} className="btn-ghost">Preview</Link>
                {c.status !== "live" && (
                  <form action={setChannelStatus}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="live" />
                    <button className="btn-primary" type="submit">Approve &amp; publish</button>
                  </form>
                )}
                {c.status === "live" && (
                  <form action={setChannelStatus}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value="paused" />
                    <button className="btn-ghost" type="submit">Pause</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
