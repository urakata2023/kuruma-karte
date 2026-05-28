import 'server-only'
import { Resend } from 'resend'

let _client: Resend | null = null

/**
 * Resend クライアント（lazy singleton）
 * RESEND_API_KEY が未設定だと throw する
 */
export function getResend(): Resend {
  if (!_client) {
    const key = process.env.RESEND_API_KEY
    if (!key) {
      throw new Error(
        'RESEND_API_KEY is not set. Add it to .env.local and Vercel env.'
      )
    }
    _client = new Resend(key)
  }
  return _client
}

/**
 * 送信元メールアドレス
 * テスト：onboarding@resend.dev（自分のRESENDアカウントメール宛にしか届かない）
 * 本番：独自ドメイン認証後に noreply@<domain> へ
 */
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

/**
 * 汎用メール送信ヘルパー。
 * RESEND_API_KEY が未設定の場合は警告ログだけ出して何もしない (機能を止めない)。
 */
export async function sendMail(params: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[sendMail] RESEND_API_KEY 未設定。送信スキップ:', params.subject)
    return
  }
  const r = getResend()
  await r.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  })
}
