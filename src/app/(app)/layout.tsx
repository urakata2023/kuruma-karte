import { getCurrentShop } from '@/lib/shop'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { getTheme } from '@/lib/themes'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSuperAdmin } from '@/lib/admin-auth'

/**
 * (app) Route Group: 管理画面の共通レイアウト (Phase L 刷新版)
 *
 * Sidebar (左固定 / モバイルではハンバーガー) + TopBar (上固定検索) +
 * メインコンテンツの3ペイン構成。Linear/Stripe 風。
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { shop } = await getCurrentShop()
  const theme = getTheme(shop.theme)

  const [pendingCount, superAdmin] = await Promise.all([
    (async () => {
      try {
        const admin = createAdminClient()
        const { count } = await admin
          .from('reservations')
          .select('id', { count: 'exact', head: true })
          .eq('shop_id', shop.id)
          .in('status', ['requested', 'pending_shop'])
        return count ?? 0
      } catch {
        return 0
      }
    })(),
    isSuperAdmin(),
  ])

  return (
    <div
      data-theme={theme.id}
      className="flex min-h-screen"
      style={{ background: 'var(--canvas)', color: 'var(--ink)' }}
    >
      <Sidebar
        shopName={shop.name}
        themeId={theme.id}
        pendingReservationCount={pendingCount}
        isSuperAdmin={superAdmin}
      />
      <div className="flex flex-1 flex-col md:pl-64">
        <TopBar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
