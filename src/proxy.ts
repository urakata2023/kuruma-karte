import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

/**
 * Next.js 16 Proxy（旧 middleware）
 * Supabaseセッションのリフレッシュと未認証ユーザーのリダイレクト。
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 以下を除く全リクエストにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico
     * - 画像ファイル
     * - /lp（静的マーケティングLP。public/lp/ を直接配信させる）
     */
    '/((?!_next/static|_next/image|favicon.ico|lp(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
