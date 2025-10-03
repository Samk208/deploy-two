import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  type Profile = { role?: string | null } | null;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  // If there's a database error (connection/query), return 500 with minimal info
  if (error) {
    const minimal = {
      ok: false,
      message: "Failed to retrieve profile",
      // Avoid leaking user details in error responses
    } as const;
    return NextResponse.json(minimal, { status: 500 });
  }

  // Treat missing profile as valid (role: null)
  const role: string | null = (profile?.role ?? null) as string | null;
  return NextResponse.json(
    { user: { id: user.id, email: user.email }, role },
    { status: 200 }
  );
}
