export const runtime = "nodejs";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request);

    const { data: sessionData } = await supabase.auth.getSession();
    const { data: userData } = await supabase.auth.getUser();

    const authUser = userData?.user ?? null;

    let profile: { role?: string | null } | null = null;
    if (authUser?.id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .maybeSingle<{ role: string | null }>();
      profile = prof ?? null;
    }

    const expectedRedirect = (() => {
      const role = (profile?.role || "").toString();
      if (role === "admin") return "/admin/dashboard";
      if (role === "supplier" || role === "brand") return "/dashboard/supplier";
      if (role === "influencer") return "/dashboard/influencer";
      return "/";
    })();

    return NextResponse.json({
      ok: true,
      sessionExists: !!sessionData?.session,
      user: authUser
        ? {
            id: authUser.id,
            email: authUser.email,
            appMetadata: authUser.app_metadata,
            identities: authUser.identities?.map((i: any) => ({
              provider: i?.provider,
              email: i?.identity_data?.email ?? null,
            })),
          }
        : null,
      profile,
      expectedRedirect,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
