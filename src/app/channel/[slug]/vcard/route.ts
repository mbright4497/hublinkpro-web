import sharp from "sharp";
import { supabaseServer } from "@/lib/supabase/server";

// "Save to contacts": a vCard for a live Channel. Includes only what the owner already shows publicly,
// plus the optional contact email if they chose to add one.
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

// vCard lines are folded at 75 characters.
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 75) { out.push(rest.slice(0, 75)); rest = " " + rest.slice(75); }
  out.push(rest);
  return out.join("\r\n");
}

// The logo is shrunk to a small square so the contact file stays light on every phone.
async function logoBase64(url: string | null): Promise<{ type: string; data: string } | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 8_000_000) return null;
    const out = await sharp(buf).resize(256, 256, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
    return { type: "JPEG", data: out.toString("base64") };
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await supabaseServer();
  const { data: c } = await supabase
    .from("channels")
    .select("slug,name,status,phone,website,city,tagline,logo_url,contact_email")
    .eq("slug", slug)
    .maybeSingle();
  if (!c || c.status !== "live") return new Response("Not found", { status: 404 });

  const photo = await logoBase64(c.logo_url);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(c.name)}`,
    `N:${esc(c.name)};;;;`,
    `ORG:${esc(c.name)}`,
    ...(c.tagline ? [`TITLE:${esc(c.tagline)}`] : []),
    ...(c.phone ? [`TEL;TYPE=WORK,VOICE:${String(c.phone).replace(/[^0-9+()\- ]/g, "")}`] : []),
    ...(c.contact_email ? [`EMAIL;TYPE=WORK:${c.contact_email}`] : []),
    `URL:https://hublinkpro.com/channel/${c.slug}`,
    ...(c.website ? [`URL;TYPE=WORK:${c.website}`] : []),
    ...(c.city ? [`ADR;TYPE=WORK:;;;${esc(c.city)};;;`] : []),
    "NOTE:Saved from HubLinkPro",
    ...(photo ? [`PHOTO;ENCODING=b;TYPE=${photo.type}:${photo.data}`] : []),
    "END:VCARD",
  ];
  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `inline; filename="${c.slug}.vcf"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
