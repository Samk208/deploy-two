"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient({ cookies: cookieStore });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    const base = "Could not authenticate user";
    const msg =
      process.env.NODE_ENV === "development" && error?.message
        ? `${base}: ${error.message}`
        : base;
    return redirect(`/sign-in?message=${encodeURIComponent(msg)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle<{ role: UserRole }>();

  // Accept role from multiple sources; precedence matters.
  // 1) app_metadata.role or user_metadata.role === 'admin' must override profile role
  // 2) influencer/supplier prefer profile role; fall back to metadata
  const appRole = String(
    (data.user as any)?.app_metadata?.role || ""
  ).toUpperCase();
  const userMetaRole = String(
    (data.user as any)?.user_metadata?.role || ""
  ).toUpperCase();
  const profileRole = String(profile?.role || "").toUpperCase();

  // Admin override: treat as admin even if profile says 'customer'
  if (appRole === "ADMIN" || userMetaRole === "ADMIN") {
    return redirect("/admin/dashboard");
  }

  // Influencer routing
  if (
    profileRole === "INFLUENCER" ||
    appRole === "INFLUENCER" ||
    userMetaRole === "INFLUENCER"
  ) {
    return redirect("/dashboard/influencer");
  }

  // Supplier routing
  if (
    profileRole === "SUPPLIER" ||
    appRole === "SUPPLIER" ||
    userMetaRole === "SUPPLIER"
  ) {
    return redirect("/dashboard/supplier");
  }
  // Missing profile or role: send user to onboarding/profile setup instead of arbitrary redirect
  console.warn(
    "[sign-in] Missing or undefined role for user; redirecting to onboarding"
  );
  return redirect("/auth/onboarding");
}
