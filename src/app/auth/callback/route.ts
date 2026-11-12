import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

// Only ever redirect to a path on this site.
const safe = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard");

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safe(searchParams.get("next"));

  const supabase = await supabaseServer();
  let failed = true;
  if (code) {
    failed = !!(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (token_hash && type) {
    failed = !!(await supabase.auth.verifyOtp({ type, token_hash })).error;
  }
  return NextResponse.redirect(`${origin}${failed ? "/login?error=1" : next}`);
}
