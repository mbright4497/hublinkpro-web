"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CodeEntry from "@/components/CodeEntry";

type S = { status: string; eta?: number; pro?: { name: string; slug: string; phone: string | null } | null; fallback?: { name: string; phone: string }[]; canReportNoShow?: boolean };

export default function SosStatus({ token }: { token: string }) {
  const [s, setS] = useState<S | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let stop = false;
    async function tick() {
      try {
        const r = await fetch(`/api/sos/${token}`, { cache: "no-store" });
        if (r.status === 404) { setMissing(true); return; }
        const j = (await r.json()) as S;
        if (!stop) setS(j);
        if (["done", "expired", "cancelled"].includes(j.status)) return;
      } catch { /* retry */ }
      if (!stop) setTimeout(tick, 5000);
    }
    tick();
    return () => { stop = true; };
  }, [token]);

  async function noShow() {
    await fetch(`/api/sos/${token}`, { method: "POST" });
    setS(null);
  }

  if (missing) return <div className="bookbox"><p>We couldn&apos;t find that request.</p><Link href="/sos" className="btn-ghost">Start over</Link></div>;
  if (!s) return <div className="bookbox"><p>Loading…</p></div>;

  if (s.status === "unverified") return <CodeEntry token={token} doneHref={`/sos/${token}`} />;
  if (s.status === "claimed" || s.status === "arrived") {
    return (
      <div className="bookbox" aria-live="polite">
        <h2 style={{ marginTop: 0 }}>{s.pro?.name} is on the way</h2>
        <p className="lead" style={{ marginBottom: 12 }}>{s.status === "arrived" ? "They've arrived." : `About ${s.eta} minutes.`}</p>
        {s.pro?.phone && <a className="btn-primary" href={`tel:${s.pro.phone}`}>Call {s.pro.name}</a>}
        {s.canReportNoShow && <p style={{ marginTop: 16 }}><button type="button" className="btn-ghost" onClick={noShow}>They never showed. Find someone else.</button></p>}
      </div>
    );
  }
  if (s.status === "done") return <div className="bookbox"><h2>All done.</h2><Link href="/" className="btn-ghost">Back to HubLinkPro</Link></div>;
  if (s.status === "expired") return <div className="bookbox"><h2>We couldn&apos;t reach anyone in time.</h2><p className="lead">Sorry. Try again, or browse local pros directly.</p><Link href="/sos" className="btn-primary">Try again</Link></div>;
  return (
    <div className="bookbox" aria-live="polite">
      <h2 style={{ marginTop: 0 }}>Calling pros near you…</h2>
      <p className="lead" style={{ marginBottom: 12 }}>Keep this page open. We&apos;ll text you the moment someone accepts.</p>
      {!!s.fallback?.length && (
        <>
          <p style={{ fontWeight: 700 }}>Want to try them yourself?</p>
          {s.fallback.map((p) => <p key={p.phone}><a className="btn-ghost" href={`tel:${p.phone}`}>Call {p.name}</a></p>)}
        </>
      )}
    </div>
  );
}
