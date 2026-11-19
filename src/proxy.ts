import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase/env";
import { DEFAULT_MARKET_SLUG, MARKET_COOKIE, getMarkets, isMarketSlug, marketForPoint } from "@/lib/markets";

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|lighthouse|headless|monitor/i;

// Homepage only: send a visitor to their own market's homepage. Their saved choice wins; otherwise
// Vercel's approximate IP location picks the launched market they're in. Crawlers never get
// redirected, so search engines always see the flagship homepage. No match = stay put.
async function marketRedirect(request: NextRequest) {
  const next = NextResponse.next();
  if (BOT.test(request.headers.get("user-agent") ?? "")) return next;
  const markets = await getMarkets();
  const saved = request.cookies.get(MARKET_COOKIE)?.value;
  let target;
  if (isMarketSlug(saved)) {
    target = markets.find((m) => m.slug === saved && m.launched);
  } else {
    const lat = Number(request.headers.get("x-vercel-ip-latitude"));
    const lng = Number(request.headers.get("x-vercel-ip-longitude"));
    if (Number.isFinite(lat) && Number.isFinite(lng) && request.headers.get("x-vercel-ip-latitude")) {
      target = marketForPoint(markets, lat, lng);
    }
  }
  if (target && target.slug !== DEFAULT_MARKET_SLUG) {
    const res = NextResponse.redirect(new URL(`/m/${target.slug}`, request.url), 307);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }
  return next;
}

// Keeps the Supabase session cookie fresh on every route that reads the login (the Channel page checks for the owner),
// and routes the homepage by market. A page that reads the login but isn't listed here refreshes it without being able
// to save the new one, which signs the owner out on their next dashboard visit.
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") return marketRedirect(request);
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  // Someone who is already signed in never needs the sign-in form: the "Build your Channel" buttons all point at
  // /login, so without this they get asked to sign in again after leaving the dashboard. A failed email link
  // (?error) still shows the form so they can see what went wrong.
  if (user && request.nextUrl.pathname === "/login" && !request.nextUrl.searchParams.has("error")) {
    const home = NextResponse.redirect(new URL("/dashboard", request.url), 307);
    response.cookies.getAll().forEach((c) => home.cookies.set(c));
    home.headers.set("Cache-Control", "private, no-store");
    return home;
  }
  return response;
}

export const config = { matcher: ["/", "/dashboard/:path*", "/admin/:path*", "/channel/:path*", "/login", "/auth/:path*"] };
