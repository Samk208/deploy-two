"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/";
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient({ cookies: cookieStore });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return redirect("/sign-in?message=Could not authenticate user");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle<{ role: UserRole }>();

  if (profile?.role === UserRole.ADMIN) {
    return redirect("/admin/dashboard");
  }

  if (profile?.role === UserRole.INFLUENCER) {
    return redirect("/dashboard/influencer");
  }

  if (profile?.role === UserRole.SUPPLIER) {
    return redirect("/dashboard/supplier");
  }

  return redirect(redirectTo);
}
