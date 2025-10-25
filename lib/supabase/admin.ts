import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Admin client with service role key - bypasses RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

// Use the simple client for admin operations - no cookies needed
const supabaseHost = (() => {
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return "";
  }
})();
const __allowProdInDev =
  process.env.SUPABASE_ALLOW_PROD_IN_DEV === "true" ||
  process.env.NEXT_PUBLIC_SUPABASE_ALLOW_PROD_IN_DEV === "true";
if (
  process.env.NODE_ENV === "development" &&
  /\.supabase\.co$/i.test(supabaseHost) &&
  !__allowProdInDev
) {
  console.warn(
    "[supabase] Using live Supabase host in development for admin client. Set SUPABASE_ALLOW_PROD_IN_DEV=true to silence this warning."
  );
}
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Type helpers
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Re-export for consistency
export { supabaseAdmin as default };
