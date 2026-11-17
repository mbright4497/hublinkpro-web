// Blog posts are markdown files in /content/blog, named YYYY-MM-DD-slug.md.
// Frontmatter: title, description, service (optional), draft (optional, true = hidden in production).
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const DIR = path.join(process.cwd(), "content", "blog");

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  service: string | null;
  draft: boolean;
  body: string;
};

function parse(file: string): Post | null {
  const m = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!m) return null;
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fm) return null;
  const meta: Record<string, string> = {};
  for (const line of fm[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  if (!meta.title || !meta.description) return null;
  return {
    slug: m[2],
    title: meta.title,
    description: meta.description,
    date: m[1],
    service: meta.service || null,
    draft: meta.draft === "true",
    body: fm[2],
  };
}

// Drafts show on Vercel previews and locally, never on production.
const showDrafts = () => process.env.VERCEL_ENV !== "production";

export function getPosts(): Post[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .map(parse)
    .filter((p): p is Post => !!p && (showDrafts() || !p.draft))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);

export const renderPost = (p: Post) => marked.parse(p.body, { async: false }) as string;

export const prettyDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
