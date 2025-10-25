// lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  const allowProdInDev = process.env.SUPABASE_ALLOW_PROD_IN_DEV === "true";
  if (process.env.NODE_ENV === "development" && !allowProdInDev && /\.supabase\.co$/i.test(host)) {
    throw new Error(
      "Blocked live Supabase host in development. Point NEXT_PUBLIC_SUPABASE_URL to http://127.0.0.1:54321"
    );
  }
  return createClient(url, service, { auth: { persistSession: false } });
}
