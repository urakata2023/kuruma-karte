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
     * - /api/*（API ルート。各 route が自前で認証を行う。
     *   特に /api/stripe/webhook は Stripe からの POST がここで /login へ
     *   307 にされると本番の課金イベントが一切DBに反映されない致命事故になる。
     *   /api/cron も Bearer token 認証で proxy 不要、/api/manifest/[token] は
     *   public、/api/search は getCurrentShop() で自前 auth）
     */
    '/((?!_next/static|_next/image|favicon.ico|lp(?:/|$)|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
