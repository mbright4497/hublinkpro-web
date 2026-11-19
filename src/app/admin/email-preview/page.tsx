import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/supabase/env";
import { renderEmail, setupEmail, codeEmail } from "@/lib/email-template";
import { buildNudgeParts, type Candidate } from "@/lib/nudge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email preview | HubLinkPro" };

const sample: Candidate = { user_id: "00000000-0000-0000-0000-000000000000", email: "owner@example.com", channel_name: "Sample Roofing Co", has_channel: true, has_logo: false, has_phone: true, has_services: true, has_video: false };

export default async function EmailPreview() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) notFound();

  const setup = setupEmail({ name: "Chrystal", channelName: "Chrystal R Crispin Realtor", codeMonths: 12 });
  const code = codeEmail({ code: "HLP-XXXXXX", months: 12 });
  const items = [
    { label: "Setup done for you", subject: setup.subject, parts: setup.parts },
    { label: "Founding code", subject: code.subject, parts: code.parts },
    { label: "Nudge: signed up, no Channel (day 1)", ...buildNudgeParts("day1", { ...sample, has_channel: false }) },
    { label: "Nudge: draft saved (day 1)", ...buildNudgeParts("day1", sample) },
    { label: "Nudge: draft waiting (day 5)", ...buildNudgeParts("day5", sample) },
  ];
  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <h1>Email preview</h1>
      <p className="lead">Every email now uses one layout. Nothing here is sent.</p>
      {items.map((it) => (
        <section key={it.label} style={{ margin: "28px 0" }}>
          <h2 className="dsec" style={{ borderTop: 0 }}>{it.label}</h2>
          <p style={{ color: "var(--color-muted)", fontSize: 14, margin: "0 0 8px" }}>Subject: {it.subject}</p>
          <iframe title={it.label} srcDoc={renderEmail(it.parts).html} style={{ width: "100%", height: 560, border: "1px solid var(--color-line)", borderRadius: 12, background: "#f3f4f6" }} />
        </section>
      ))}
    </div>
  );
}
