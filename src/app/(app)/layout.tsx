import { getCurrentShop } from '@/lib/shop'
import { Header } from '@/components/header'
import { getTheme } from '@/lib/themes'

/**
 * (app) Route Group：認証必須エリアの共通レイアウト
 * ヘッダー＋認証チェック（未認証ならgetCurrentShopが/loginにredirect）
 * 店舗テーマ (Phase 10) を data-theme で適用
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { shop } = await getCurrentShop()
  const theme = getTheme(shop.theme)
  return (
    <div data-theme={theme.id} className="flex flex-1 flex-col">
      <Header shopName={shop.name} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
