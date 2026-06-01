import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Proxy 用 Supabase クライアント + セッションリフレッシュ
 *
 * 全リクエストで実行され、Supabaseのセッションcookieを更新する。
 * Next.js 16 では middleware → proxy に名称変更。
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // セッションリフレッシュ（同時にユーザー情報も取得）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 未認証時、保護されたルートへのアクセスを /login にリダイレクト
  // /r/* は顧客自身の公開登録フロー、/my/* はオーナー向け愛車マイページ。どちらも認証不要
  // /legal/* は特商法表記など、誰でも閲覧できる必要がある法定ページ
  const publicPaths = ['/', '/login', '/signup', '/auth', '/r', '/my', '/legal']
  const isPublicPath = publicPaths.some(
    (p) =>
      request.nextUrl.pathname === p ||
      request.nextUrl.pathname.startsWith(`${p}/`)
  )

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // /admin/* はスーパー管理者だけ。誤って漏れないよう env未設定なら全員ブロック。
  // 通常店舗ユーザーに「管理画面の存在」を見せたくないので、403ではなく /login へ流す。
  const isAdminPath =
    request.nextUrl.pathname === '/admin' ||
    request.nextUrl.pathname.startsWith('/admin/')
  if (isAdminPath) {
    const target = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() ?? ''
    const email = user?.email?.toLowerCase() ?? ''
    if (!target || email !== target) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
