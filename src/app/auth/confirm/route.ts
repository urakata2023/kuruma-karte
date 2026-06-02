import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * メール確認リンクのコールバック。
 * Supabase の確認メール（Confirm email ON 時）から飛んでくる。
 *
 * - PKCE 形式: ?code=...           → exchangeCodeForSession
 * - token_hash 形式: ?token_hash=...&type=signup → verifyOtp
 *
 * 成功するとセッションが張られ、?next（既定 /dashboard）へリダイレクト。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  // 失敗（リンク期限切れ・改ざん等）はログインへ
  return NextResponse.redirect(`${origin}/login?error=confirm`)
}
