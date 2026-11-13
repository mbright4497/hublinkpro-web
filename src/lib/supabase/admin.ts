import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/env";

// Server-only client for webhooks that have no signed-in user (Twilio calling us).
// Uses the service-role key, which bypasses RLS: never import this from a client component,
// and only use it after the caller has been authenticated some other way (e.g. a Twilio signature).
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
