import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost, prettyDate, renderPost } from "@/lib/blog";
import { SITE_URL, jsonLd } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) return {};
  return {
    title: `${p.title} · HubLinkPro`,
    description: p.description,
    alternates: { canonical: `${SITE_URL}/blog/${p.slug}` },
    openGraph: { title: p.title, description: p.description, type: "article", publishedTime: p.date },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) notFound();
  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="logo">H</span>
          <span>HubLink<span className="pro">Pro</span></span>
        </Link>
        <span className="navlinks">
          <Link href="/blog">← All posts</Link>
        </span>
        <span />
      </nav>
      <article className="page blog">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: p.title,
              description: p.description,
              datePublished: p.date,
              mainEntityOfPage: `${SITE_URL}/blog/${p.slug}`,
              publisher: { "@id": `${SITE_URL}/#org` },
            }),
          }}
        />
        <p className="pdate">{prettyDate(p.date)}</p>
        <h1>{p.title}</h1>
        <div className="postbody" dangerouslySetInnerHTML={{ __html: renderPost(p) }} />
        <aside className="postcta">
          <b>Need a pro{p.service ? ` for ${p.service.toLowerCase()}` : ""}?</b>
          <span>Browse vetted local Channels, or get help right now if something just broke.</span>
          <span className="ctabtns">
            <Link href="/" className="ctaa">Find a pro</Link>
            <Link href="/sos" className="ctab">🚨 Home emergency</Link>
          </span>
        </aside>
      </article>
    </>
  );
}
