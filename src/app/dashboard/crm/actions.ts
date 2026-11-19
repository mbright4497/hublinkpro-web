"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { fmtDayLabel } from "@/lib/booking";
import { addDays, isStatus, parseDollars, phoneDigits, phoneKey, statusLabel, todayIn } from "@/lib/crm";

const clip = (v: FormDataEntryValue | null, n: number) => String(v ?? "").trim().slice(0, n);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Row level security already limits every query to the signed-in owner's own Channel. These
// helpers also check it in code, so a bad id fails cleanly instead of silently doing nothing.
async function owner() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: ch } = await supabase
    .from("channels")
    .select("id,booking_timezone")
    .eq("owner_id", user.id)
    .order("id")
    .limit(1)
    .maybeSingle();
  if (!ch) redirect("/dashboard");
  return { supabase, ch };
}

type Db = Awaited<ReturnType<typeof owner>>["supabase"];

async function logEvent(db: Db, leadId: number, channelId: number, kind: "note" | "status" | "follow_up" | "edit", body: string) {
  await db.from("lead_events").insert({ lead_id: leadId, channel_id: channelId, kind, body: body.slice(0, 2000) });
}

function leadId(formData: FormData): number {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) redirect("/dashboard/crm");
  return id;
}

// Only ever send people back to a CRM page.
function back(formData: FormData, fallback: string): string {
  const s = String(formData.get("back") ?? "");
  return s.startsWith("/dashboard/crm") && !s.startsWith("//") ? s : fallback;
}

export async function addLead(formData: FormData) {
  const { supabase, ch } = await owner();
  const name = clip(formData.get("name"), 120);
  const phone = clip(formData.get("phone"), 30);
  const email = clip(formData.get("email"), 200).toLowerCase();
  const service = clip(formData.get("service"), 120);
  const note = clip(formData.get("note"), 2000);

  if (!name) redirect("/dashboard/crm?error=name");
  if (phone && phoneDigits(phone).length < 7) redirect("/dashboard/crm?error=phone");
  if (email && !EMAIL.test(email)) redirect("/dashboard/crm?error=email");

  // The same phone number is the same person: open the lead you already have.
  const key = phoneKey(phone);
  if (key) {
    const { data: existing } = await supabase.from("leads").select("id").eq("channel_id", ch.id).eq("phone_key", key).maybeSingle();
    if (existing) redirect(`/dashboard/crm/${existing.id}?dup=1`);
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      channel_id: ch.id,
      name,
      phone: phone || null,
      phone_key: key,
      email: email || null,
      service: service || null,
      source: "manual",
    })
    .select("id")
    .single();
  if (error || !lead) redirect(`/dashboard/crm?error=${error?.message?.includes("lead_limit") ? "limit" : "save"}`);

  await logEvent(supabase, lead.id, ch.id, "edit", "Added to your leads");
  if (note) await logEvent(supabase, lead.id, ch.id, "note", note);
  redirect(`/dashboard/crm/${lead.id}?added=1`);
}

export async function setLeadStatus(formData: FormData) {
  const { supabase, ch } = await owner();
  const id = leadId(formData);
  const status = String(formData.get("status"));
  const to = back(formData, `/dashboard/crm/${id}`);
  if (!isStatus(status)) redirect(to);

  const { data: lead } = await supabase.from("leads").select("id,status").eq("id", id).eq("channel_id", ch.id).maybeSingle();
  if (!lead) redirect("/dashboard/crm");
  if (lead.status !== status) {
    const patch: Record<string, unknown> = { status, last_activity_at: new Date().toISOString() };
    // A finished lead has nothing left to follow up.
    if (status === "won" || status === "lost") patch.follow_up_on = null;
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (!error) await logEvent(supabase, id, ch.id, "status", `Moved to ${statusLabel(status)}`);
  }
  redirect(to);
}

export async function saveLead(formData: FormData) {
  const { supabase, ch } = await owner();
  const id = leadId(formData);
  const here = `/dashboard/crm/${id}`;

  const name = clip(formData.get("name"), 120);
  const phone = clip(formData.get("phone"), 30);
  const email = clip(formData.get("email"), 200).toLowerCase();
  const service = clip(formData.get("service"), 120);
  const value = parseDollars(formData.get("value"));

  if (!name) redirect(`${here}?error=name`);
  if (phone && phoneDigits(phone).length < 7) redirect(`${here}?error=phone`);
  if (email && !EMAIL.test(email)) redirect(`${here}?error=email`);
  if (value === "invalid") redirect(`${here}?error=value`);

  const { error } = await supabase
    .from("leads")
    .update({
      name,
      phone: phone || null,
      phone_key: phoneKey(phone),
      email: email || null,
      service: service || null,
      value_cents: value,
    })
    .eq("id", id)
    .eq("channel_id", ch.id);
  if (error) redirect(`${here}?error=${error.code === "23505" ? "dup" : "save"}`);

  await logEvent(supabase, id, ch.id, "edit", "Updated details");
  redirect(`${here}?saved=1`);
}

export async function setFollowUp(formData: FormData) {
  const { supabase, ch } = await owner();
  const id = leadId(formData);
  const to = back(formData, `/dashboard/crm/${id}`);
  const when = String(formData.get("when") ?? "");
  const today = todayIn(ch.booking_timezone);

  let day: string | null;
  if (when === "clear") day = null;
  else if (when === "tomorrow") day = addDays(today, 1);
  else if (when === "3") day = addDays(today, 3);
  else if (when === "7") day = addDays(today, 7);
  else if (/^\d{4}-\d{2}-\d{2}$/.test(clip(formData.get("date"), 10))) day = clip(formData.get("date"), 10);
  else redirect(to);

  const { error } = await supabase.from("leads").update({ follow_up_on: day }).eq("id", id).eq("channel_id", ch.id);
  if (!error) {
    const label = day ? `${fmtDayLabel(day).dow}, ${fmtDayLabel(day).md}` : "";
    await logEvent(supabase, id, ch.id, "follow_up", day ? `Follow-up set for ${label}` : "Follow-up cleared");
  }
  redirect(to);
}

export async function addNote(formData: FormData) {
  const { supabase, ch } = await owner();
  const id = leadId(formData);
  const body = clip(formData.get("body"), 2000);
  const here = `/dashboard/crm/${id}`;
  if (!body) redirect(here);

  const { data: lead } = await supabase.from("leads").select("id").eq("id", id).eq("channel_id", ch.id).maybeSingle();
  if (!lead) redirect("/dashboard/crm");
  await logEvent(supabase, id, ch.id, "note", body);
  await supabase.from("leads").update({ last_activity_at: new Date().toISOString() }).eq("id", id);
  redirect(`${here}#timeline`);
}

export async function deleteLead(formData: FormData) {
  const { supabase, ch } = await owner();
  const id = leadId(formData);
  await supabase.from("leads").delete().eq("id", id).eq("channel_id", ch.id);
  redirect("/dashboard/crm?deleted=1");
}
