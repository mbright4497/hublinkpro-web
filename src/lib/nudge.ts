// Help-emails for half-finished signups. Server-only.
import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/site";
import { renderEmail, type EmailParts } from "@/lib/email-template";

export type Candidate = {
  user_id: string;
  email: string;
  channel_name: string | null;
  has_channel: boolean;
  has_logo: boolean;
  has_phone: boolean;
  has_services: boolean;
  has_video: boolean;
};

const secret = () => process.env.CRON_SECRET || "";

export const optoutSig = (userId: string) => createHmac("sha256", secret()).update(`optout:${userId}`).digest("hex").slice(0, 32);

export function optoutOk(userId: string, sig: string): boolean {
  if (!secret() || !/^[0-9a-f-]{36}$/i.test(userId) || !/^[0-9a-f]{32}$/.test(sig)) return false;
  const a = Buffer.from(optoutSig(userId));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

function missingBits(c: Candidate): string {
  const m: string[] = [];
  if (!c.has_logo) m.push("a logo");
  if (!c.has_phone) m.push("a phone number");
  if (!c.has_services) m.push("your services");
  if (!c.has_video) m.push("a short video");
  if (m.length === 0) return "";
  const list = m.length === 1 ? m[0] : `${m.slice(0, -1).join(", ")} and ${m[m.length - 1]}`;
  return `Right now it's missing ${list}. You can add those any time, even after it's live.`;
}

export function buildNudgeParts(kind: "day1" | "day5", c: Candidate): { subject: string; parts: EmailParts } {
  const link = `${SITE_URL}/dashboard`;
  const optoutUrl = `${SITE_URL}/api/nudge/optout?u=${c.user_id}&s=${optoutSig(c.user_id)}`;
  const reply = "If something got in your way or didn't make sense, just reply to this email.";

  if (!c.has_channel) {
    return kind === "day1"
      ? {
          subject: "You're signed up. Your Channel is next",
          parts: { preheader: "It takes about five minutes.", heading: "Your Channel is next", optoutUrl,
            paragraphs: ["You signed up for HubLinkPro but haven't built your Channel yet. It's a short form: your name, what you do, and a logo.", "Then press Publish my Channel and I'll take a quick look and get you live.", reply],
            button: { label: "Build my Channel", url: link } },
        }
      : {
          subject: "Still want a Channel on HubLinkPro?",
          parts: { preheader: "Your spot is still open.", heading: "Your spot is still open", optoutUrl,
            paragraphs: ["If you'd like to build your Channel, it only takes a few minutes.", "If it isn't for you, no hard feelings. Tell me what got in the way, or use the link at the bottom and these emails stop."],
            button: { label: "Build my Channel", url: link } },
        };
  }

  const name = c.channel_name ? ` (${c.channel_name})` : "";
  const miss = missingBits(c);
  return kind === "day1"
    ? {
        subject: "Your HubLinkPro Channel is saved but not live yet",
        parts: { preheader: "One button and it's on its way.", heading: "Your Channel is saved, not live yet", optoutUrl,
          paragraphs: [`You started your Channel on HubLinkPro${name} and it's saved. Nobody can see it until you press Publish my Channel on your dashboard.`, ...(miss ? [miss] : []), reply],
          button: { label: "Finish my Channel", url: link } },
      }
    : {
        subject: "Your Channel is still waiting",
        parts: { preheader: "Press Publish and we'll take it from there.", heading: "Your Channel is still waiting", optoutUrl,
          paragraphs: [`Your Channel${name} is still a draft, so nobody can see it. When you're ready, press Publish my Channel.`, "If you got stuck, reply and tell me where. If this isn't for you, use the link at the bottom and these emails stop."],
          button: { label: "Publish my Channel", url: link } },
      };
}

export function buildNudge(kind: "day1" | "day5", c: Candidate): { subject: string; text: string; html: string } {
  const { subject, parts } = buildNudgeParts(kind, c);
  return { subject, ...renderEmail(parts) };
}
