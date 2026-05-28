import { getCurrentShop } from '@/lib/shop'
import { Header } from '@/components/header'
import { getTheme } from '@/lib/themes'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * (app) Route Group：認証必須エリアの共通レイアウト
 * ヘッダー＋認証チェック（未認証ならgetCurrentShopが/loginにredirect）
 * 店舗テーマ (Phase 10) + 予約バッジ件数 (Phase K) を Header に渡す
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { shop } = await getCurrentShop()
  const theme = getTheme(shop.theme)

  // 承認待ち予約件数 (ヘッダーバッジ用)
  let pendingCount = 0
  try {
    const admin = createAdminClient()
    const { count } = await admin
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shop.id)
      .in('status', ['requested', 'pending_shop'])
    pendingCount = count ?? 0
  } catch {
    // バッジ取得失敗してもページは表示
  }

  return (
    <div data-theme={theme.id} className="flex flex-1 flex-col">
      <Header shopName={shop.name} pendingReservationCount={pendingCount} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
