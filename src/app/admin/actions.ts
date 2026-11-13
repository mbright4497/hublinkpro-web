"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/supabase/env";

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
