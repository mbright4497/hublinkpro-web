"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomInt } from "node:crypto";
import { supabaseServer } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/supabase/env";
import { toE164 } from "@/lib/twilio";

export async function setChannelStatus(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!id || !["live", "paused", "pending", "draft"].includes(status)) return;
  // The database re-checks admin via RLS + trigger, so this can't be forged from the client.
  await supabase.from("channels").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

export async function markMessageRead(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");
  const id = Number(formData.get("id"));
  if (!id) return;
  // RLS also restricts this update to the admin.
  await supabase.from("contact_messages").update({ read: true }).eq("id", id);
  revalidatePath("/admin");
}

export async function saveNote(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");
  const userId = String(formData.get("user_id") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 2000);
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return;
  // admin_notes is admin-only via RLS.
  await supabase.from("admin_notes").upsert({ user_id: userId, note, updated_at: new Date().toISOString() });
  revalidatePath("/admin");
}


const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L lookalikes

export async function createCode(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");
  let code = String(formData.get("code") ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
  if (!code) code = "HLP-" + Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
  if (code.length < 4) redirect("/admin?code=short");
  const label = String(formData.get("label") ?? "").trim().slice(0, 120);
  const months = Math.min(60, Math.max(1, Number(formData.get("months")) || 12));
  const max_uses = Math.min(1000, Math.max(1, Number(formData.get("max_uses")) || 1));
  const exp = String(formData.get("expires") ?? "");
  const expires_at = /^\d{4}-\d{2}-\d{2}$/.test(exp) ? new Date(`${exp}T23:59:59-05:00`).toISOString() : null;
  // promo_codes is admin-only via RLS.
  const { error } = await supabase.from("promo_codes").insert({ code, label, months, max_uses, expires_at });
  if (error) redirect(`/admin?code=${error.code === "23505" ? "dup" : "error"}`);
  revalidatePath("/admin");
  redirect(`/admin?code=made&c=${encodeURIComponent(code)}`);
}

export async function setCodeActive(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");
  const id = Number(formData.get("id"));
  if (!id) return;
  await supabase.from("promo_codes").update({ active: formData.get("active") === "1" }).eq("id", id);
  revalidatePath("/admin");
}

export async function assignTrackingNumber(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const raw = String(formData.get("number") ?? "").trim();
  const number = raw ? toE164(raw) : null; // blank clears the number
  if (!slug || (raw && !number)) redirect("/admin?trk=invalid#tracking");
  const { data, error } = await supabase.from("channels").update({ tracking_number: number }).eq("slug", slug).select("id");
  if (error) redirect(`/admin?trk=${error.code === "23505" ? "taken" : "error"}#tracking`);
  if (!data?.length) redirect("/admin?trk=noslug#tracking");
  revalidatePath("/admin");
  redirect("/admin?trk=saved#tracking");
}
