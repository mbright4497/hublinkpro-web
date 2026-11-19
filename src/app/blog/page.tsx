import Link from "next/link";
import type { Metadata } from "next";
import { getPosts, prettyDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "The HubLinkPro Blog · Tri-Cities home and local tips",
  description: "Straight talk on home repairs, local pros and what to do when something breaks, from the Tri-Cities.",
};

export const revalidate = 60;

export default async function BlogIndex() {
  const posts = await getPosts();
  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="logo">H</span>
          <span>HubLink<span className="pro">Pro</span></span>
        </Link>
        <span className="navlinks">
          <Link href="/">← Back to HubLinkPro</Link>
        </span>
        <span />
      </nav>
      <div className="page blog">
        <h1>The HubLinkPro Blog</h1>
        <p className="lead">Straight talk from the Tri-Cities on home repairs, local pros and what to do when something breaks.</p>
        {posts.length === 0 && <p className="lead">First posts are on the way.</p>}
        <ul className="postlist">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`}>
                <span className="pdate">{prettyDate(p.date)}</span>
                <span className="ptitle">{p.title}</span>
                <span className="pdesc">{p.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
