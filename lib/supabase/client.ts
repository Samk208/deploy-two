import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Client-side Supabase client - ONLY use this in client components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Regular client for browser operations (Row Level Security enabled)
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
// Do not hard-block in development; only warn unless explicitly configured
if (
  process.env.NODE_ENV === "development" &&
  /\.supabase\.co$/i.test(supabaseHost) &&
  !__allowProdInDev
) {
  // Keep the app running; developers can still point to local if desired
  console.warn(
    "[supabase] Using live Supabase host in development. Set SUPABASE_ALLOW_PROD_IN_DEV=true to silence this warning."
  );
}
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Re-export the client creation function for consistency
export function createClientSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Type helpers
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Re-export for consistency
export { supabase as default };
