import QRCode from "qrcode";
import { supabaseServer } from "@/lib/supabase/server";

// Printable QR (SVG) for a live Channel. ?download=1 saves it as a file.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await supabaseServer();
  const { data } = await supabase.from("channels").select("slug,status").eq("slug", slug).maybeSingle();
  if (!data || data.status !== "live") return new Response("Not found", { status: 404 });

  const svg = await QRCode.toString(`https://hublinkpro.com/channel/${data.slug}?src=qr`, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#0b1220", light: "#ffffff" },
  });
  const headers: Record<string, string> = {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "public, max-age=3600",
  };
  if (new URL(req.url).searchParams.get("download")) {
    headers["Content-Disposition"] = `attachment; filename="${data.slug}-hublinkpro-qr.svg"`;
  }
  return new Response(svg, { headers });
}
