// Help-emails for half-finished signups. Server-only.
import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/site";

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

export function buildNudge(kind: "day1" | "day5", c: Candidate): { subject: string; text: string } {
  const link = `${SITE_URL}/dashboard`;
  const opt = `${SITE_URL}/api/nudge/optout?u=${c.user_id}&s=${optoutSig(c.user_id)}`;
  const foot = `\n\n— Matt Bright\nHubLinkPro, Johnson City, Tennessee\n\nDon't want these emails? ${opt}`;

  if (!c.has_channel) {
    return kind === "day1"
      ? {
          subject: "You're signed up. Your Channel is next",
          text: `Hi,\n\nYou signed up for HubLinkPro but haven't built your Channel yet. It's a short form: your name, what you do, and a logo. Then you press Submit for review and I'll look it over and get you live.\n\nPick it back up here: ${link}\n\nIf something got in your way or didn't make sense, reply to this email. It comes straight to me.${foot}`,
        }
      : {
          subject: "Still want a Channel on HubLinkPro?",
          text: `Hi,\n\nYour spot is still open. If you'd like to build your Channel, it's here: ${link}\n\nIf it isn't for you, no hard feelings. Just tell me what got in the way, or use the link below and these emails stop.${foot}`,
        };
  }

  const name = c.channel_name ? ` (${c.channel_name})` : "";
  const miss = missingBits(c);
  return kind === "day1"
    ? {
        subject: "Your HubLinkPro Channel is saved but not live yet",
        text: `Hi,\n\nYou started your Channel on HubLinkPro${name} and it's saved. It isn't live yet, though. Nobody can see it until you press Submit for review at the bottom of the page.\n\n${miss ? miss + "\n\n" : ""}Finish it here: ${link}\n\nIf something got in your way or didn't make sense, reply to this email. It comes straight to me.${foot}`,
      }
    : {
        subject: "Your Channel is still waiting",
        text: `Hi,\n\nYour Channel${name} is still saved as a draft, so nobody can see it. When you're ready, press Submit for review here: ${link}\n\nIf you got stuck, reply and tell me where. If this isn't for you, use the link below and these emails stop.${foot}`,
      };
}
