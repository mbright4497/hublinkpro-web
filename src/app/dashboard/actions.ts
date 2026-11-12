"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { BUCKET, SOCIALS, hostMatches, isReelUrl } from "@/lib/media";

const SMS_CONSENT_TEXT =
  "I agree to receive text messages from HubLinkPro about my Channel, my leads, and my account. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase.";

function cleanUrl(v: FormDataEntryValue | null): string | null | "invalid" {
  const s = String(v ?? "").trim();
  if (!s) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "invalid";
  } catch {
    return "invalid";
  }
}

// Only addresses inside this owner's own storage folder are accepted for uploaded media.
function mediaUrl(v: FormDataEntryValue | null, userId: string): string | null {
  const s = String(v ?? "").trim();
  return s.startsWith(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${userId}/`) ? s : null;
}

const list = (v: FormDataEntryValue | null) =>
  String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30);

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "channel";

export async function saveChannel(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = Number(formData.get("id")) || null;
  const intent = String(formData.get("intent") ?? "save");
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  if (!name) redirect("/dashboard?error=name");

  const website = cleanUrl(formData.get("website"));
  const booking_url = cleanUrl(formData.get("booking_url"));
  const video_url = cleanUrl(formData.get("video_url"));
  if ([website, booking_url, video_url].includes("invalid")) redirect("/dashboard?error=url");

  // Social links: web addresses, each on the right platform.
  const social_links: Record<string, string> = {};
  for (const sc of SOCIALS) {
    const u = cleanUrl(formData.get(`social_${sc.key}`));
    if (u === "invalid" || (u && !hostMatches(u, sc.hosts))) redirect("/dashboard?error=social");
    if (u) social_links[sc.key] = u;
  }

  // Reels: one address per line, from the supported platforms, max 6.
  const reels: string[] = [];
  for (const line of String(formData.get("reels") ?? "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 6)) {
    const u = cleanUrl(line);
    if (u === "invalid" || !u || !isReelUrl(u)) redirect("/dashboard?error=reel");
    reels.push(u);
  }

  const consent = formData.get("sms_consent") === "on";
  const fields = {
    logo_url: mediaUrl(formData.get("logo_url"), user.id),
    hero_image_url: mediaUrl(formData.get("hero_image_url"), user.id),
    video_file_url: mediaUrl(formData.get("video_file_url"), user.id),
    social_links,
    reels,
    name,
    network_id: Number(formData.get("network_id")) || null,
    services: list(formData.get("services")),
    tagline: String(formData.get("tagline") ?? "").trim().slice(0, 120) || null,
    description: String(formData.get("description") ?? "").trim().slice(0, 2000) || null,
    phone: String(formData.get("phone") ?? "").trim().slice(0, 30) || null,
    website,
    booking_url,
    video_url,
    city: String(formData.get("city") ?? "").trim().slice(0, 60) || null,
    zip_codes: list(formData.get("zip_codes")).filter((z) => /^\d{5}$/.test(z)),
    is_food_truck: formData.get("is_food_truck") === "on",
  };

  let current: { id: number; status: string; sms_consent: boolean } | null = null;
  if (id) {
    const { data } = await supabase.from("channels").select("id,status,sms_consent").eq("id", id).maybeSingle();
    current = data;
    if (!current) redirect("/dashboard?error=notfound");
  }

  // Consent is only ever recorded from the box the owner actually checked, with the exact text shown.
  const consentFields =
    consent && !current?.sms_consent
      ? { sms_consent: true, sms_consent_text: SMS_CONSENT_TEXT, sms_consent_at: new Date().toISOString() }
      : {};

  const wantsReview = intent === "submit";
  const status = wantsReview && (!current || current.status === "draft") ? "pending" : undefined;

  if (current) {
    const { error } = await supabase
      .from("channels")
      .update({ ...fields, ...consentFields, ...(status ? { status } : {}) })
      .eq("id", current.id);
    if (error) redirect("/dashboard?error=save");
  } else {
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase
      .from("channels")
      .insert({ ...fields, ...consentFields, owner_id: user.id, slug, status: status ?? "draft" });
    if (error) redirect("/dashboard?error=save");
  }

  // Best-effort lead hand-off to GHL when a Channel is submitted. Never blocks the owner.
  if (status === "pending" && process.env.HLP_INTAKE_WEBHOOK_URL) {
    fetch(process.env.HLP_INTAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "channel-submitted",
        business: name,
        email: user.email,
        phone: fields.phone,
        sms_consent: consent,
        sms_consent_text: consent ? SMS_CONSENT_TEXT : null,
        received_at: new Date().toISOString(),
      }),
    }).catch((e) => console.error("[HLP-INTAKE] webhook error", String(e)));
  }

  redirect(status === "pending" ? "/dashboard?submitted=1" : "/dashboard?saved=1");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
