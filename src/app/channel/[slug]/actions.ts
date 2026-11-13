"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { fmtWhen, tzLabel } from "@/lib/booking";
import { sendEmail, ownerEmail } from "@/lib/notify";

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

// Book a real time slot. The database re-checks the slot is open and blocks double-booking,
// so two people clicking the same time can never both get it.
export async function bookSlot(formData: FormData) {
  const slug = clip(formData.get("slug"), 200);
  const back = `/channel/${encodeURIComponent(slug)}`;
  const slot = clip(formData.get("slot"), 40);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(clip(formData.get("day"), 10)) ? clip(formData.get("day"), 10) : "";
  const dayQ = day ? `day=${day}&` : "";

  // Honeypot: real people never fill this hidden field. Pretend success.
  if (clip(formData.get("company_site"), 200)) redirect(`${back}?requested=1#book`);

  const name = clip(formData.get("name"), 120);
  const phone = clip(formData.get("phone"), 30);
  const email = clip(formData.get("email"), 200) || null;
  const service = clip(formData.get("service"), 120) || null;
  const message = clip(formData.get("message"), 2000) || null;
  const consent = formData.get("sms_consent") === "on";

  const startMs = Date.parse(slot);
  if (!slot || Number.isNaN(startMs)) redirect(`${back}?${dayQ}bkerror=slot#book`);
  if (!name || phone.replace(/\D/g, "").length < 7) redirect(`${back}?${dayQ}bkerror=info&slot=${encodeURIComponent(slot)}#book`);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`${back}?${dayQ}bkerror=info&slot=${encodeURIComponent(slot)}#book`);

  const supabase = await supabaseServer();
  const { data: ch } = await supabase
    .from("channels")
    .select("id,name,phone,owner_id,booking_timezone,slot_minutes")
    .eq("slug", slug)
    .eq("status", "live")
    .eq("booking_enabled", true)
    .maybeSingle();
  if (!ch) redirect(back);

  const { data: bookingId, error } = await supabase.rpc("book_slot", {
    p_channel_id: ch.id,
    p_start: new Date(startMs).toISOString(),
    p_name: name,
    p_phone: phone,
    p_email: email,
    p_service: service,
    p_message: message,
    p_consent: consent,
    p_consent_text: consent ? BOOKING_CONSENT_TEXT : null,
  });
  if (error || bookingId == null) {
    const m = error?.message ?? "";
    const why = m.includes("slot_taken") ? "taken" : m.includes("too_many") ? "limit" : "error";
    redirect(`${back}?${dayQ}bkerror=${why}#book`);
  }

  const startIso = new Date(startMs).toISOString();
  const when = fmtWhen(startIso, ch.booking_timezone);
  const zone = tzLabel(ch.booking_timezone);

  // Best-effort emails. The booking is already saved.
  let emailed = false;
  if (email) {
    emailed = await sendEmail({
      to: email,
      subject: `You're booked with ${ch.name}: ${when}`,
      text:
        `Hi ${name},\n\nYou're booked with ${ch.name} on ${when} (${zone} time).\n` +
        (service ? `Service: ${service}\n` : "") +
        (ch.phone ? `\nNeed to change it? Call ${ch.phone}.\n` : "\nNeed to change it? Reply to the business directly.\n") +
        `\nSent through HubLinkPro.`,
    });
  }
  const to = await ownerEmail(ch.owner_id);
  if (to) {
    await sendEmail({
      to,
      replyTo: email ?? undefined,
      subject: `New booking: ${name}, ${when}`,
      text:
        `${name} booked ${when} (${zone} time) on your HubLinkPro Channel.\n\n` +
        `Phone: ${phone}\n` +
        (email ? `Email: ${email}\n` : "") +
        (service ? `Service: ${service}\n` : "") +
        (message ? `\nThey wrote:\n${message}\n` : "") +
        `\nSee and manage bookings: https://hublinkpro.com/dashboard#bookings`,
    });
  }

  redirect(`${back}?booked=${encodeURIComponent(startIso)}${emailed ? "&emailed=1" : ""}#book`);
}
