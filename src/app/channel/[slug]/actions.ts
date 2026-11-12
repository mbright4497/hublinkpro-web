"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

const BOOKING_CONSENT_TEXT =
  "I agree to receive text messages about this request from the business and from HubLinkPro on its behalf. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase.";

const clip = (v: FormDataEntryValue | null, n: number) => String(v ?? "").trim().slice(0, n);

export async function requestBooking(formData: FormData) {
  const slug = clip(formData.get("slug"), 200);
  const back = `/channel/${encodeURIComponent(slug)}`;

  // Honeypot: real people never fill this hidden field. Pretend success.
  if (clip(formData.get("company_site"), 200)) redirect(`${back}?requested=1#book`);

  const name = clip(formData.get("name"), 120);
  const phone = clip(formData.get("phone"), 30);
  const email = clip(formData.get("email"), 200) || null;
  const service = clip(formData.get("service"), 120) || null;
  const message = clip(formData.get("message"), 2000) || null;
  const preferred_time = clip(formData.get("preferred_time"), 200) || null;
  const consent = formData.get("sms_consent") === "on";

  if (!name || phone.replace(/\D/g, "").length < 7) redirect(`${back}?reqerror=1#book`);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`${back}?reqerror=1#book`);

  const supabase = await supabaseServer();
  const { data: ch } = await supabase
    .from("channels")
    .select("id,name,phone,status")
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle();
  if (!ch) redirect(back);

  const { error } = await supabase.from("booking_requests").insert({
    channel_id: ch.id,
    name,
    phone,
    email,
    service,
    message,
    preferred_time,
    sms_consent: consent,
    sms_consent_text: consent ? BOOKING_CONSENT_TEXT : null,
    sms_consent_at: consent ? new Date().toISOString() : null,
  });
  if (error) redirect(`${back}?reqerror=1#book`);

  // Best-effort hand-off to GoHighLevel. The request is already saved, so this never blocks the visitor.
  if (process.env.HLP_INTAKE_WEBHOOK_URL) {
    try {
      await fetch(process.env.HLP_INTAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "booking-request",
          channel: ch.name,
          channel_slug: slug,
          name,
          phone,
          email,
          service,
          message,
          preferred_time,
          sms_consent: consent,
          sms_consent_text: consent ? BOOKING_CONSENT_TEXT : null,
          received_at: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error("[HLP-BOOKING] webhook error", String(e));
    }
  }

  redirect(`${back}?requested=1#book`);
}
