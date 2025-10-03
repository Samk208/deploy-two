import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureTypedClient } from "@/lib/supabase/types";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isSafePath(path: string | null): path is string {
  if (!path) return false;
  return (
    path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\")
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const cookieStore = cookies();
    const supabase = ensureTypedClient(
      await createServerSupabaseClient({ cookies: cookieStore })
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Check if the user is new. A small buffer is used to account for minor clock differences.
          const isNewUser =
            user.created_at &&
            user.last_sign_in_at &&
            Math.abs(
              new Date(user.created_at).getTime() -
                new Date(user.last_sign_in_at).getTime()
            ) < 2000;

          if (isNewUser) {
            // This is a new user, create their profile before redirecting
            const payload: TablesInsert<"profiles"> = {
              id: user.id,
              name: (user.user_metadata?.full_name as string) || user.email || "",
              role: "customer",
            }

            const { error: insertError } = await supabase
              .from("profiles")
              .insert(payload);

            if (insertError) {
              // If the profile already exists (race/duplicate), ignore; otherwise surface
              const code = (insertError as any).code || "";
              const msg = insertError.message || "";
              const isDuplicate = code === "23505" || /duplicate|unique/i.test(msg);
              if (!isDuplicate) {
                console.error("profiles insert failed in OAuth callback:", insertError);
                return NextResponse.redirect(
                  new URL("/auth/auth-code-error?message=profile-create-failed", request.url)
                );
              }
            }

            // New users should go to onboarding
            return NextResponse.redirect(
              new URL("/auth/onboarding", request.url)
            );
          }

          // For existing users, redirect based on their role or the 'next' param
          if (isSafePath(next)) {
            return NextResponse.redirect(new URL(next, request.url));
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle<{ role: string | null }>();

          const role = (profile?.role || "").toString();
          const redirectPath =
            role === "admin"
              ? "/admin/dashboard"
              : role === "supplier" || role === "brand"
                ? "/dashboard/supplier"
                : role === "influencer"
                  ? "/dashboard/influencer"
                  : "/";

          return NextResponse.redirect(new URL(redirectPath, request.url));
        }
      } catch (e) {
        // fall through to default redirect
        console.error("Error in auth callback:", e);
      }

      // Default redirect if anything goes wrong
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL("/auth/auth-code-error", request.url));
}
