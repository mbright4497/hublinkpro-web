// Blog posts live in the blog_posts table and are written from /admin/blog.
// Public reads go through plain REST with a 60s revalidate (RLS only exposes published rows),
// so /blog stays cacheable. The admin editor uses the signed-in client and sees drafts too.
import { marked } from "marked";
import { SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase/env";

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD, Eastern time
  service: string | null;
  body: string;
};

type Row = { slug: string; title: string; description: string; service: string | null; body: string; published_at: string | null };

const toPost = (r: Row): Post => ({
  slug: r.slug,
  title: r.title,
  description: r.description,
  service: r.service,
  body: r.body,
  date: new Date(r.published_at ?? Date.now()).toLocaleDateString("en-CA", { timeZone: "America/New_York" }),
});

async function query(qs: string): Promise<Post[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?select=slug,title,description,service,body,published_at&published=eq.true&${qs}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return ((await res.json()) as Row[]).map(toPost);
  } catch {
    return [];
  }
}

export const getPosts = () => query("order=published_at.desc");
export const getPost = async (slug: string) => (await query(`slug=eq.${encodeURIComponent(slug)}&limit=1`))[0];

export const renderMarkdown = (md: string) => marked.parse(md, { async: false }) as string;
export const renderPost = (p: Post) => renderMarkdown(p.body);

export const prettyDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
