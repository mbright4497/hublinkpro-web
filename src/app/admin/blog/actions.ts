"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/supabase/env";

const slugify = (t: string) =>
  t.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "post";

function refresh(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function savePost(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");

  const id = Number(formData.get("id")) || null;
  const intent = String(formData.get("intent") ?? "save"); // save | publish | unpublish
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const description = String(formData.get("description") ?? "").trim().slice(0, 200);
  const service = String(formData.get("service") ?? "").trim().slice(0, 40) || null;
  const body = String(formData.get("body") ?? "");
  const back = id ? `/admin/blog?id=${id}` : "/admin/blog";
  if (!title || !description) redirect(`${back}${id ? "&" : "?"}err=missing`);
  if (intent === "publish" && !body.trim()) redirect(`${back}${id ? "&" : "?"}err=empty`);

  let existing: { id: number; slug: string; published_at: string | null } | null = null;
  if (id) {
    const { data } = await supabase.from("blog_posts").select("id,slug,published_at").eq("id", id).maybeSingle();
    existing = data;
    if (!existing) redirect("/admin/blog");
  }

  const fields: Record<string, unknown> = { title, description, service, body, updated_at: new Date().toISOString() };
  if (intent === "publish") {
    fields.published = true;
    fields.published_at = existing?.published_at ?? new Date().toISOString();
  } else if (intent === "unpublish") {
    fields.published = false;
  }

  let postId = existing?.id ?? null;
  let slug = existing?.slug;
  if (existing) {
    const { error } = await supabase.from("blog_posts").update(fields).eq("id", existing.id);
    if (error) redirect(`${back}&err=save`);
  } else {
    // The web address is made from the title once, and never changes after that.
    const base = slugify(title);
    for (let n = 0; n < 5; n++) {
      slug = n === 0 ? base : `${base}-${n + 1}`;
      const { data, error } = await supabase.from("blog_posts").insert({ ...fields, slug }).select("id").single();
      if (!error) { postId = data.id; break; }
      if (error.code !== "23505") redirect("/admin/blog?err=save");
    }
    if (!postId) redirect("/admin/blog?err=save");
  }
  refresh(slug);
  redirect(`/admin/blog?id=${postId}&done=${intent}`);
}

export async function deletePost(formData: FormData) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");
  const id = Number(formData.get("id"));
  if (!id) return;
  // Only drafts can be deleted; a live post has to be unpublished first.
  await supabase.from("blog_posts").delete().eq("id", id).eq("published", false);
  refresh();
  redirect("/admin/blog?done=deleted");
}
