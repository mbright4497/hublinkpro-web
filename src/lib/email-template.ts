// One professional layout for every email the site sends. Table-based with inline styles so it
// renders the same in Gmail, Outlook, and Apple Mail. Always returns a plain-text twin too.
import { SITE_URL } from "@/lib/site";

export type EmailParts = {
  preheader?: string; // the grey preview line next to the subject in an inbox
  heading: string;
  paragraphs: string[]; // plain text; blank-line separated in the text version
  bullets?: string[];
  codeBox?: { label: string; value: string }; // e.g. a founding code
  button?: { label: string; url: string };
  signoff?: boolean; // default true: "Matt Bright / HubLinkPro, Johnson City, Tennessee"
  optoutUrl?: string;
  footerNote?: string; // replaces the "just reply to this email" line (use when replies don't go to Matt)
};

const BRAND = "#d85a30";
const INK = "#061021";
const TEXT = "#1f2937";
const MUTED = "#6b7280";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const para = (s: string) => esc(s).replace(/\n/g, "<br>");

export function renderEmail(p: EmailParts): { html: string; text: string } {
  const sign = p.signoff !== false;
  const paras = p.paragraphs.map((t) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${TEXT};">${para(t)}</p>`).join("");
  const bullets = p.bullets?.length
    ? `<ul style="margin:0 0 16px;padding-left:20px;font-size:16px;line-height:1.6;color:${TEXT};">${p.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
    : "";
  const code = p.codeBox
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;"><tr><td style="background:#fff7ed;border:1px dashed ${BRAND};border-radius:10px;padding:14px 22px;text-align:center;">
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};">${esc(p.codeBox.label)}</div>
        <div style="font-size:24px;font-weight:700;letter-spacing:.06em;color:${INK};font-family:Menlo,Consolas,monospace;">${esc(p.codeBox.value)}</div></td></tr></table>`
    : "";
  const button = p.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;"><tr><td style="background:${BRAND};border-radius:10px;"><a href="${esc(p.button.url)}" style="display:inline-block;padding:14px 26px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">${esc(p.button.label)}</a></td></tr></table>`
    : "";
  const signature = sign
    ? `<p style="margin:8px 0 0;font-size:16px;line-height:1.5;color:${TEXT};">Matt Bright<br><span style="color:${MUTED};font-size:14px;">Founder, HubLinkPro · Johnson City, Tennessee</span></p>`
    : "";
  const optout = p.optoutUrl
    ? `<br>Don't want these emails? <a href="${esc(p.optoutUrl)}" style="color:${MUTED};text-decoration:underline;">Stop them here</a>.`
    : "";

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(p.heading)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f3f4f6;">${esc(p.preheader ?? "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<tr><td style="background:${INK};padding:18px 28px;">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="background:${BRAND};border-radius:8px;width:34px;height:34px;text-align:center;font-weight:800;font-size:19px;color:#ffffff;line-height:34px;">H</td>
    <td style="padding-left:11px;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-.01em;">HubLink<span style="color:#fb923c;">Pro</span></td>
  </tr></table>
</td></tr>
<tr><td style="padding:30px 28px 10px;">
  <h1 style="margin:0 0 18px;font-size:23px;line-height:1.25;color:${INK};">${esc(p.heading)}</h1>
  ${paras}${bullets}${code}${button}${signature}
</td></tr>
<tr><td style="padding:22px 28px 26px;font-size:12px;line-height:1.6;color:${MUTED};border-top:1px solid #e5e7eb;">
  HubLinkPro · Local pros, verified work, your neighborhood.<br>
  <a href="${SITE_URL}" style="color:${MUTED};">hublinkpro.com</a> · ${p.footerNote ? esc(p.footerNote) : "Questions? Just reply to this email and it comes straight to me."}${optout}
</td></tr>
</table></td></tr></table></body></html>`;

  const lines: string[] = [p.heading, "", ...p.paragraphs.flatMap((t) => [t, ""])];
  if (p.bullets?.length) lines.push(...p.bullets.map((b) => `- ${b}`), "");
  if (p.codeBox) lines.push(`${p.codeBox.label}: ${p.codeBox.value}`, "");
  if (p.button) lines.push(`${p.button.label}: ${p.button.url}`, "");
  if (sign) lines.push("Matt Bright", "Founder, HubLinkPro · Johnson City, Tennessee", "");
  lines.push(p.footerNote ?? "Questions? Just reply to this email and it comes straight to me.");
  if (p.optoutUrl) lines.push(`Don't want these emails? ${p.optoutUrl}`);
  return { html, text: lines.join("\n") };
}

// Sent after Matt sets someone up by hand (submitted their Channel, applied a founding code).
export function setupEmail(o: { name?: string; channelName?: string; codeMonths?: number; dashboardUrl?: string }): { subject: string; parts: EmailParts } {
  const bits: string[] = [];
  if (o.channelName) bits.push(`I submitted your Channel (${o.channelName}) so it's in line to go live. I'll take a quick look and publish it.`);
  if (o.codeMonths) bits.push(`I also added your founding code, so you have Pro free for ${o.codeMonths} months. It goes back to Free on its own when the time is up.`);
  return {
    subject: "You're set up on HubLinkPro",
    parts: {
      preheader: "I finished setting up your Channel for you.",
      heading: o.name ? `You're all set, ${o.name}` : "You're all set",
      paragraphs: ["I went ahead and took care of a couple of things so you don't have to.", ...bits, "You can sign in any time to change your photos, phone number, or anything else. Nothing is locked."],
      button: { label: "Open my dashboard", url: o.dashboardUrl ?? `${SITE_URL}/dashboard` },
    },
  };
}

export function codeEmail(o: { code: string; months: number }): { subject: string; parts: EmailParts } {
  return {
    subject: "Your HubLinkPro Pro code",
    parts: {
      preheader: `Pro free for ${o.months} months.`,
      heading: "Your founding code",
      paragraphs: [`Here's your founding code for HubLinkPro. It gives you Pro free for ${o.months} months, then goes back to Free on its own when the time is up.`, "Sign in, open the Plan tab on your dashboard, and enter it there."],
      codeBox: { label: "Founding code", value: o.code },
      button: { label: "Open my dashboard", url: `${SITE_URL}/dashboard?tab=plan` },
    },
  };
}


// ---- Request and booking emails (sent from the Channel page) ----

type Lead = { name: string; phone: string; email?: string | null; service?: string | null; message?: string | null; preferredTime?: string | null };
const leadBullets = (l: Lead, when?: string) => [
  ...(when ? [`When: ${when}`] : []),
  `Phone: ${l.phone}`,
  ...(l.email ? [`Email: ${l.email}`] : []),
  ...(l.service ? [`Service: ${l.service}`] : []),
  ...(l.preferredTime ? [`Best time: ${l.preferredTime}`] : []),
];

// To the Channel owner the moment a request comes in. Replies go to the customer, not to Matt.
export function requestAlertEmail(o: { lead: Lead }): { subject: string; parts: EmailParts } {
  const { lead } = o;
  return {
    subject: `New request: ${lead.name}${lead.service ? `, ${lead.service}` : ""}`,
    parts: {
      preheader: `${lead.name} just asked for you. Reply fast.`,
      heading: `New request from ${lead.name}`,
      paragraphs: ["Someone just sent a request on your HubLinkPro Channel. The first business to reply usually wins the job.", ...(lead.message ? [`They wrote:\n${lead.message}`] : [])],
      bullets: leadBullets(lead),
      button: { label: "Open my requests", url: `${SITE_URL}/dashboard#bookings` },
      signoff: false,
      footerNote: lead.email ? "Reply to this email to answer them directly." : "They didn't leave an email, so give them a call.",
    },
  };
}

// To the customer right after they send a request.
export function requestConfirmEmail(o: { lead: Lead; channelName: string; channelPhone?: string | null; channelUrl: string }): { subject: string; parts: EmailParts } {
  const { lead, channelName } = o;
  return {
    subject: `We got your request: ${channelName}`,
    parts: {
      preheader: `${channelName} will be in touch soon.`,
      heading: "Your request is in",
      paragraphs: [`Hi ${lead.name}, your request went to ${channelName}. They'll contact you soon.`, ...(o.channelPhone ? [`Want to talk sooner? Call ${o.channelPhone}.`] : [])],
      bullets: lead.service ? [`Service: ${lead.service}`] : undefined,
      button: { label: `View ${channelName}`, url: o.channelUrl },
      signoff: false,
      footerNote: `Sent by HubLinkPro on behalf of ${channelName}.`,
    },
  };
}

// To the customer after they book a real time slot.
export function bookingConfirmEmail(o: { lead: Lead; channelName: string; channelPhone?: string | null; channelUrl: string; when: string; zone: string }): { subject: string; parts: EmailParts } {
  const { lead, channelName } = o;
  return {
    subject: `You're booked with ${channelName}: ${o.when}`,
    parts: {
      preheader: `${o.when} (${o.zone} time)`,
      heading: "You're booked",
      paragraphs: [`Hi ${lead.name}, you're booked with ${channelName}.`, o.channelPhone ? `Need to change it? Call ${o.channelPhone}.` : "Need to change it? Reply to the business directly."],
      bullets: [`When: ${o.when} (${o.zone} time)`, ...(lead.service ? [`Service: ${lead.service}`] : [])],
      button: { label: `View ${channelName}`, url: o.channelUrl },
      signoff: false,
      footerNote: `Sent by HubLinkPro on behalf of ${channelName}.`,
    },
  };
}

// To the Channel owner when someone books a time.
export function bookingAlertEmail(o: { lead: Lead; when: string; zone: string }): { subject: string; parts: EmailParts } {
  const { lead } = o;
  return {
    subject: `New booking: ${lead.name}, ${o.when}`,
    parts: {
      preheader: `${lead.name} booked ${o.when}.`,
      heading: `New booking from ${lead.name}`,
      paragraphs: [`${lead.name} booked a time on your HubLinkPro Channel.`, ...(lead.message ? [`They wrote:\n${lead.message}`] : [])],
      bullets: leadBullets(lead, `${o.when} (${o.zone} time)`),
      button: { label: "See my bookings", url: `${SITE_URL}/dashboard#bookings` },
      signoff: false,
      footerNote: lead.email ? "Reply to this email to answer them directly." : "They didn't leave an email, so give them a call.",
    },
  };
}
