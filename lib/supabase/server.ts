import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// For Pages Router - create server client with request context
export async function createServerSupabaseClient(
  context?: NextRequest | { cookies: any }
) {
  // If called with a NextRequest, use its immutable request cookies (read-only)
  if (context && "headers" in (context as any)) {
    const request = context as NextRequest;
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        // In middleware/request context we cannot mutate request cookies here.
        // Session refresh in middleware is handled by lib/supabase/middleware.updateSession.
        // Provide a no-op to satisfy the interface.
        setAll() {},
      },
    });
  }

  // If called with an explicit cookie store (e.g. from next/headers cookies())
  if (context && "cookies" in (context as any)) {
    // In App Router, cookies() is async in Next 15. Callers should pass an awaited store.
    const store = (context as { cookies: any }).cookies;
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return store?.get?.(name)?.value;
        },
        set(name: string, value: string, options?: any) {
          store?.set?.(name, value, options);
        },
        remove(name: string, options?: any) {
          store?.set?.(name, "", { ...(options || {}), maxAge: 0 });
        },
      },
    });
  }

  // Fallback for when no context is provided - use Next.js App Router cookies store
  // Next 15: cookies() must be awaited when used in a dynamic context
  const store = await nextCookies();
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return store?.get?.(name)?.value;
      },
      set(name: string, value: string, options?: any) {
        store?.set?.(name, value, options);
      },
      remove(name: string, options?: any) {
        store?.set?.(name, "", { ...(options || {}), maxAge: 0 });
      },
    },
  });
}

// Type helpers
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Re-export for consistency
export { createServerSupabaseClient as default };
