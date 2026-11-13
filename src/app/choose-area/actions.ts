"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { DEFAULT_MARKET_SLUG, MARKET_COOKIE, getMarket, isMarketSlug } from "@/lib/markets";

// The visitor picks an area. Remember it, then send them to that market's homepage.
export async function chooseMarket(formData: FormData) {
  const slug = String(formData.get("market") ?? "");
  const market = isMarketSlug(slug) ? await getMarket(slug) : undefined;
  if (!market || !market.launched) redirect("/choose-area");
  (await cookies()).set(MARKET_COOKIE, market.slug, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  redirect(market.slug === DEFAULT_MARKET_SLUG ? "/" : `/m/${market.slug}`);
}

// "Not in my area yet": leave an email (and ZIP) so we know where to open next.
export async function joinWaitlist(formData: FormData) {
  const back = String(formData.get("back") ?? "/choose-area");
  const to = back.startsWith("/") && !back.startsWith("//") ? back : "/choose-area";
  if (String(formData.get("company_site") ?? "")) redirect(`${to}${to.includes("?") ? "&" : "?"}joined=1`); // honeypot

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const zip = String(formData.get("zip") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim().slice(0, 80);
  const slugIn = String(formData.get("market") ?? "");
  const market_slug = isMarketSlug(slugIn) ? slugIn : null;
  const sep = to.includes("?") ? "&" : "?";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254 || (zip && !/^\d{5}$/.test(zip))) {
    redirect(`${to}${sep}error=1`);
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.from("market_waitlist").insert({ email, zip: zip || null, city: city || null, market_slug });
  // A repeat signup hits the unique index. Same outcome for the visitor, so say thanks either way.
  if (error && error.code !== "23505") redirect(`${to}${sep}error=1`);
  redirect(`${to}${sep}joined=1`);
}
