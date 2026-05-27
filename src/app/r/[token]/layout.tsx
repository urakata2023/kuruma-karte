import { createAdminClient } from '@/lib/supabase/admin'
import { getTheme } from '@/lib/themes'

/**
 * 公開登録ページ /r/[token] のレイアウト
 *
 * URL の registration_token から shop を逆引きし、theme を data-theme で適用する。
 * これで「ガレージJ Premium Black」「町工場Aは Bavarian Blue」といった
 * 各店舗のブランド世界観で登録フォームが表示される。
 */
export default async function PublicRegistrationLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  let themeId = 'default'
  try {
    const admin = createAdminClient()
    const { data: shop } = await admin
      .from('shops')
      .select('theme')
      .eq('registration_token', token)
      .maybeSingle<{ theme: string }>()
    if (shop?.theme) themeId = shop.theme
  } catch {
    // テーマ取得失敗時はデフォルト
  }

  const theme = getTheme(themeId)

  return (
    <div data-theme={theme.id} className="flex min-h-full flex-1 flex-col">
      {children}
    </div>
  )
}
