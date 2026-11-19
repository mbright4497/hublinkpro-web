import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/supabase/env";
import { renderMarkdown } from "@/lib/blog";
import { savePost, deletePost } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog editor | HubLinkPro", robots: { index: false } };

const MSG: Record<string, string> = {
  save: "Draft saved. Nobody can see it yet.",
  publish: "Published. It is live on hublinkpro.com/blog within a minute.",
  unpublish: "Taken down. It is a draft again.",
  deleted: "Draft deleted.",
};
const ERR: Record<string, string> = {
  missing: "A title and a short description are required.",
  empty: "Write something in the post before publishing.",
  save: "Couldn't save. Try again.",
};
const field = { width: "100%", background: "var(--color-ink)", color: "#fff", border: "1px solid var(--color-line)", borderRadius: 8, padding: "10px 12px", fontSize: 16 } as const;

export default async function BlogAdmin({ searchParams }: { searchParams: Promise<{ id?: string; done?: string; err?: string }> }) {
  const { id, done = "", err = "" } = await searchParams;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) notFound();

  const { data: posts } = await supabase.from("blog_posts").select("id,slug,title,published,published_at,updated_at").order("updated_at", { ascending: false });
  const pid = Number(id) || null;
  const { data: cur } = pid
    ? await supabase.from("blog_posts").select("id,slug,title,description,service,body,published").eq("id", pid).maybeSingle()
    : { data: null };

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand"><span className="logo">H</span><span>HubLink<span className="pro">Pro</span></span></Link>
        <Link href="/admin">← Admin</Link>
        <span />
      </nav>
      <div className="page" style={{ maxWidth: 820 }}>
        <h1>Blog</h1>
        {MSG[done] && <p className="note ok">{MSG[done]}</p>}
        {ERR[err] && <p className="note">{ERR[err]}</p>}

        <h2 style={{ marginTop: 24 }}>{cur ? "Edit post" : "Write a new post"}</h2>
        <form action={savePost} className="autocard" style={{ display: "grid", gap: 14 }}>
          {cur && <input type="hidden" name="id" value={cur.id} />}
          <div className="field">
            <label htmlFor="b-title">Title</label>
            <input id="b-title" name="title" required maxLength={120} defaultValue={cur?.title ?? ""} placeholder="What to do first when a pipe bursts" style={field} />
          </div>
          <div className="field">
            <label htmlFor="b-desc">Short description (shows on Google and the blog list)</label>
            <input id="b-desc" name="description" required maxLength={200} defaultValue={cur?.description ?? ""} placeholder="One or two plain sentences." style={field} />
          </div>
          <div className="field">
            <label htmlFor="b-service">Service (optional, like Plumbing or Roofing)</label>
            <input id="b-service" name="service" maxLength={40} defaultValue={cur?.service ?? ""} style={field} />
          </div>
          <div className="field">
            <label htmlFor="b-body">The post</label>
            <textarea id="b-body" name="body" rows={18} defaultValue={cur?.body ?? ""} placeholder="Write it the way you'd tell a neighbor." style={{ ...field, lineHeight: 1.5 }} />
            <p style={{ color: "var(--color-muted)", fontSize: 13, margin: "6px 0 0" }}>
              Blank line starts a new paragraph. Start a line with <code>## </code> for a heading, <code>- </code> for a bullet. Put <code>**</code> around words to bold them.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-ghost" type="submit" name="intent" value="save">Save draft</button>
            {cur?.published ? (
              <>
                <button className="btn-primary" type="submit" name="intent" value="publish">Update live post</button>
                <button className="btn-ghost" type="submit" name="intent" value="unpublish">Take down</button>
              </>
            ) : (
              <button className="btn-primary" type="submit" name="intent" value="publish">Publish</button>
            )}
            {cur?.published && <Link href={`/blog/${cur.slug}`} className="btn-ghost">View live</Link>}
          </div>
        </form>
        {cur && !cur.published && (
          <form action={deletePost} style={{ marginTop: 10 }}>
            <input type="hidden" name="id" value={cur.id} />
            <button className="btn-ghost" type="submit">Delete this draft</button>
          </form>
        )}

        {cur && cur.body.trim() && (
          <>
            <h2 style={{ marginTop: 28 }}>Preview (as last saved)</h2>
            <div className="page blog" style={{ padding: 0 }}>
              <h1>{cur.title}</h1>
              <div className="postbody" dangerouslySetInnerHTML={{ __html: renderMarkdown(cur.body) }} />
            </div>
          </>
        )}

        <h2 style={{ marginTop: 32 }}>All posts</h2>
        {(posts ?? []).length === 0 && <p className="lead" style={{ fontSize: 14 }}>No posts yet. Write your first one above.</p>}
        {(posts ?? []).map((p) => (
          <div key={p.id} className="autocard" style={{ marginBottom: 8, display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <strong>{p.title}</strong>
              <span className="statuspill" style={{ marginLeft: 8 }}>{p.published ? "live" : "draft"}</span>
            </div>
            <Link href={`/admin/blog?id=${p.id}`} className="btn-ghost">Edit</Link>
          </div>
        ))}
        {pid && <p style={{ marginTop: 16 }}><Link href="/admin/blog">+ Write another post</Link></p>}
      </div>
    </>
  );
}
