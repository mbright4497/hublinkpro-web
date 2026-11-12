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
