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

  const payload = {
    user: { id: user.id, email: user.email },
    role: (profile?.role ?? null) as string | null,
    error: error?.message || null,
  };

  if (error) {
    return NextResponse.json(payload, { status: 500 });
  }
  return NextResponse.json(payload, { status: 200 });
}
