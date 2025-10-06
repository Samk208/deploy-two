import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth-helpers"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { sendVerificationEmail } from "@/lib/services/email"

export const runtime = "nodejs"

const sendVerificationSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력하세요"),
})

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = sendVerificationSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "잘못된 요청입니다"
      return NextResponse.json({ message }, { status: 400 })
    }
    const { email } = parsed.data

    const supabase = await createServerSupabaseClient(req)
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json({ message: "인증되지 않은 사용자입니다" }, { status: 401 })
    }

    // Rate limit: 1 minute between sends
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
    const { data: recent } = await (supabaseAdmin as any)
      .from("verification_codes")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("email", email)
      .gte("created_at", oneMinuteAgo)
      .maybeSingle()

    if (recent) {
      return NextResponse.json({ message: "잠시 후 다시 시도해주세요" }, { status: 429 })
    }

    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    const { error: upsertError } = await (supabaseAdmin as any)
      .from("verification_codes")
      .upsert(
        {
          user_id: user.id,
          email,
          code,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          verified: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,email" }
      )

    if (upsertError) {
      console.error("verification_codes upsert error:", upsertError)
      return NextResponse.json({ message: "코드 생성에 실패했습니다" }, { status: 500 })
    }

    try {
      await sendVerificationEmail({ to: email, code })
    } catch (e) {
      console.error("Email send error:", e)
      // Best-effort cleanup
      await (supabaseAdmin as any)
        .from("verification_codes")
        .delete()
        .eq("user_id", user.id)
        .eq("email", email)
      return NextResponse.json({ message: "이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요" }, { status: 502 })
    }

    return NextResponse.json({
      message: "인증 코드가 이메일로 전송되었습니다",
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error("Send verification error:", error)
    return NextResponse.json({ message: "코드 전송에 실패했습니다" }, { status: 500 })
  }
}
