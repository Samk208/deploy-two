import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth-helpers"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "6자리 코드를 입력하세요"),
})

const MAX_ATTEMPTS = 5

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = verifyEmailSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "잘못된 요청입니다"
      return NextResponse.json({ message }, { status: 400 })
    }
    const { email, code } = parsed.data

    const supabase = await createServerSupabaseClient(req)
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json({ message: "인증되지 않은 사용자입니다" }, { status: 401 })
    }

    const { data: verification, error: fetchError } = await (supabaseAdmin as any)
      .from("verification_codes")
      .select("*")
      .eq("user_id", user.id)
      .eq("email", email)
      .maybeSingle()

    if (fetchError || !verification) {
      return NextResponse.json({ message: "인증 코드를 찾을 수 없습니다" }, { status: 404 })
    }

    if (verification.verified) {
      return NextResponse.json({ message: "이미 인증된 이메일입니다", verified: true })
    }

    if ((verification.attempts ?? 0) >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { message: "최대 시도 횟수를 초과했습니다. 새 코드를 요청하세요" },
        { status: 429 }
      )
    }

    if (new Date() > new Date(verification.expires_at)) {
      return NextResponse.json(
        { message: "인증 코드가 만료되었습니다. 새 코드를 요청하세요" },
        { status: 410 }
      )
    }

    if (verification.code !== code) {
      await (supabaseAdmin as any)
        .from("verification_codes")
        .update({ attempts: (verification.attempts ?? 0) + 1, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("email", email)

      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - ((verification.attempts ?? 0) + 1))
      return NextResponse.json(
        { message: "인증 코드가 올바르지 않습니다", attemptsLeft },
        { status: 400 }
      )
    }

    // Atomic DB update: verification_codes + profiles
    const { error: rpcError } = await (supabaseAdmin as any).rpc('mark_email_verified', {
      p_user_id: user.id,
      p_email: email,
    } as any)
    if (rpcError) {
      console.error('Mark email verified RPC error:', rpcError)
      return NextResponse.json({ message: '인증에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ message: "이메일 인증이 완료되었습니다", verified: true })
  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json({ message: "인증에 실패했습니다" }, { status: 500 })
  }
}
