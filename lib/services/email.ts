import { z } from "zod"

export interface VerificationEmailData {
  to: string
  code: string
}

const EmailEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required to send emails"),
  EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email sender"),
})

export async function sendVerificationEmail(data: VerificationEmailData): Promise<void> {
  const parsed = EmailEnvSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
  })

  if (!parsed.success) {
    const first = parsed.error.errors[0]
    throw new Error(first?.message || "Email provider configuration missing")
  }

  const { RESEND_API_KEY, EMAIL_FROM } = parsed.data

  const payload = {
    from: EMAIL_FROM,
    to: [data.to],
    subject: "[One-Link] 이메일 인증 코드",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>이메일 인증</h2>
        <p>One-Link 가입을 환영합니다!</p>
        <p>아래 인증 코드를 입력하여 이메일 인증을 완료하세요:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${data.code}
        </div>
        <p style="color: #666;">이 코드는 5분 후 만료됩니다.</p>
        <p style="color: #999; font-size: 12px;">본인이 요청하지 않은 경우 이 이메일을 무시하세요.</p>
      </div>
    `,
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Email send failed: ${res.status} ${text}`)
  }
}
