"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { BUCKET, SOCIALS, hostMatches, isReelUrl } from "@/lib/media";
import { SLOT_LENGTHS, TIMEZONES } from "@/lib/booking";
import { toE164 } from "@/lib/twilio";

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

export async function setRequestStatus(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!Number.isInteger(id) || !["new", "contacted", "booked", "closed"].includes(status)) redirect("/dashboard");
  // RLS limits this to requests on the signed-in owner's own Channel.
  await supabase.from("booking_requests").update({ status }).eq("id", id);
  redirect("/dashboard#requests");
}

export async function addPortfolioItem(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: ch } = await supabase.from("channels").select("id,slug").eq("owner_id", user.id).order("id").limit(1).maybeSingle();
  if (!ch) redirect("/dashboard");
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 300) || null;
  const image = mediaUrl(formData.get("image_url"), user.id);
  const before = image ? mediaUrl(formData.get("before_url"), user.id) : null;
  const video = mediaUrl(formData.get("video_url"), user.id);
  if (!title || (!image && !video)) redirect("/dashboard?work=missing#work");
  // The database enforces the free-tier limit and that the Channel belongs to this owner (RLS).
  const { error } = await supabase
    .from("portfolio_items")
    .insert({ channel_id: ch.id, title, caption, image_url: image, before_url: before, video_url: video });
  if (error) redirect(`/dashboard?work=${error.message.includes("portfolio_limit") ? "limit" : "error"}#work`);
  revalidatePath(`/channel/${ch.slug}`);
  redirect("/dashboard?work=added#work");
}

export async function deletePortfolioItem(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/dashboard");
  // RLS limits deletes to items on the signed-in owner's own Channel.
  await supabase.from("portfolio_items").delete().eq("id", id);
  redirect("/dashboard?work=removed#work");
}


export async function redeemCode(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const code = String(formData.get("code") ?? "").trim().slice(0, 40);
  if (!code) redirect("/dashboard?code=empty#plan");
  // The database checks the code, the limits, and who you are. Nothing here can grant Pro by itself.
  const { data, error } = await supabase.rpc("redeem_promo", { p_code: code });
  const result = error ? "error" : String(data ?? "error");
  revalidatePath("/dashboard");
  redirect(`/dashboard?code=${encodeURIComponent(result)}#plan`);
}

// Owner's booking calendar: on/off, slot length, notice, window, and one working window per weekday.
export async function saveAvailability(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: ch } = await supabase.from("channels").select("id,slug").eq("owner_id", user.id).order("id").limit(1).maybeSingle();
  if (!ch) redirect("/dashboard");

  const enabled = formData.get("booking_enabled") === "on";
  const slot = Number(formData.get("slot_minutes"));
  const tz = String(formData.get("booking_timezone") ?? "");
  const notice = Number(formData.get("booking_notice_hours"));
  const windowDays = Number(formData.get("booking_window_days"));
  if (
    !SLOT_LENGTHS.includes(slot) ||
    !TIMEZONES.some((t) => t.value === tz) ||
    !Number.isInteger(notice) || notice < 0 || notice > 336 ||
    !Number.isInteger(windowDays) || windowDays < 1 || windowDays > 90
  ) redirect("/dashboard?cal=invalid#bookings");

  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  const rules: { channel_id: number; weekday: number; start_time: string; end_time: string }[] = [];
  for (let d = 0; d < 7; d++) {
    if (formData.get(`day_${d}`) !== "on") continue;
    const start = String(formData.get(`start_${d}`) ?? "");
    const end = String(formData.get(`end_${d}`) ?? "");
    if (!time.test(start) || !time.test(end) || end <= start) redirect("/dashboard?cal=hours#bookings");
    rules.push({ channel_id: ch.id, weekday: d, start_time: start, end_time: end });
  }
  if (enabled && rules.length === 0) redirect("/dashboard?cal=nodays#bookings");

  // RLS limits both writes to this owner's own Channel.
  const { error: upErr } = await supabase
    .from("channels")
    .update({
      booking_enabled: enabled,
      slot_minutes: slot,
      booking_timezone: tz,
      booking_notice_hours: notice,
      booking_window_days: windowDays,
    })
    .eq("id", ch.id);
  if (upErr) redirect("/dashboard?cal=error#bookings");

  const { error: delErr } = await supabase.from("availability_rules").delete().eq("channel_id", ch.id);
  if (delErr) redirect("/dashboard?cal=error#bookings");
  if (rules.length) {
    const { error: insErr } = await supabase.from("availability_rules").insert(rules);
    if (insErr) redirect("/dashboard?cal=error#bookings");
  }
  revalidatePath(`/channel/${ch.slug}`);
  redirect("/dashboard?cal=saved#bookings");
}

export async function cancelBooking(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/dashboard#bookings");
  // RLS limits this to bookings on the signed-in owner's own Channel.
  await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id).eq("status", "confirmed");
  redirect("/dashboard?cal=cancelled#bookings");
}

export async function saveCalls(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: ch } = await supabase.from("channels").select("id,tracking_number").eq("owner_id", user.id).order("id").limit(1).maybeSingle();
  if (!ch) redirect("/dashboard");

  const raw = String(formData.get("forward_to") ?? "").trim();
  const forward = raw ? toE164(raw) : null;
  if (raw && !forward) redirect("/dashboard?calls=badphone#calls");
  const textBack = formData.get("missed_call_text") === "on";
  if (textBack && !ch.tracking_number) redirect("/dashboard?calls=nonumber#calls");
  if (textBack && !forward) redirect("/dashboard?calls=nophone#calls");

  // RLS limits this to the owner's own Channel; the database trigger stops owners touching tracking_number.
  const { error } = await supabase.from("channels").update({ forward_to: forward, missed_call_text: textBack }).eq("id", ch.id);
  if (error) redirect("/dashboard?calls=error#calls");
  revalidatePath("/dashboard");
  redirect("/dashboard?calls=saved#calls");
}
