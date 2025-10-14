import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser, hasRole } from "@/lib/auth-helpers";
import { UserRole } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request);
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!hasRole(user, [UserRole.ADMIN])) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({
      CORE_FREEZE: process.env.CORE_FREEZE ?? null,
      SHOPS_FREEZE: process.env.SHOPS_FREEZE ?? null,
      NEXT_PUBLIC_CORE_FREEZE: process.env.NEXT_PUBLIC_CORE_FREEZE ?? null,
      NEXT_PUBLIC_SHOPS_FREEZE: process.env.NEXT_PUBLIC_SHOPS_FREEZE ?? null,
      NODE_ENV: process.env.NODE_ENV ?? null,
    });
  } catch (err) {
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
