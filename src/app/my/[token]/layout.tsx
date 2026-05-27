import { createAdminClient } from '@/lib/supabase/admin'
import { getTheme } from '@/lib/themes'

/**
 * オーナーマイページ /my/[token] のレイアウト
 *
 * URL の view_token から車両を逆引きし、紐づく shop の theme を data-theme で適用する。
 * これでお客様のマイページが店舗ごとのブランドカラーで彩られる。
 */
export default async function OwnerMyPageLayout({
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
    const { data: vehicle } = await admin
      .from('vehicles')
      .select('shop_id')
      .eq('view_token', token)
      .maybeSingle<{ shop_id: string }>()
    if (vehicle) {
      const { data: shop } = await admin
        .from('shops')
        .select('theme')
        .eq('id', vehicle.shop_id)
        .maybeSingle<{ theme: string }>()
      if (shop?.theme) themeId = shop.theme
    }
  } catch {
    // 万一テーマ取得に失敗してもデフォルトでフォールバック
  }

  const theme = getTheme(themeId)

  return (
    <div data-theme={theme.id} className="flex min-h-full flex-1 flex-col">
      {children}
    </div>
  )
}
