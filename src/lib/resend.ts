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

export type MailSendResult =
  | { status: 'sent'; messageId?: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string }

/**
 * 汎用メール送信ヘルパー (Phase I 修正版)。
 *
 * 戻り値で送信結果を明示的に返す：
 *  - sent: Resend が受理した
 *  - skipped: 環境変数未設定など、そもそも送信しなかった
 *  - failed: Resend が拒否 or ネットワーク失敗
 *
 * 呼び出し側はこの結果で logActivity の channel_status を出し分ける。
 */
export async function sendMail(params: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<MailSendResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      '[sendMail] RESEND_API_KEY 未設定。送信スキップ:',
      params.subject
    )
    return {
      status: 'skipped',
      reason: 'RESEND_API_KEY 未設定 (Vercel環境変数で設定が必要)',
    }
  }
  try {
    const r = getResend()
    const result = await r.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    })
    if (result.error) {
      return {
        status: 'failed',
        reason: result.error.message ?? String(result.error),
      }
    }
    return { status: 'sent', messageId: result.data?.id }
  } catch (e) {
    return {
      status: 'failed',
      reason: e instanceof Error ? e.message : String(e),
    }
  }
}
