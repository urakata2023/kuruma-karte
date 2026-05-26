import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * サーバー（Server Components / Server Actions / Route Handlers）用
 * Supabase クライアント
 *
 * Next.js 16 では cookies() が async になっているので await が必要。
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component から呼ばれた場合は無視
            // セッションリフレッシュは proxy.ts で行うため問題なし
          }
        },
      },
    }
  )
}
