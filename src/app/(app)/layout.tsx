import { getCurrentShop } from '@/lib/shop'
import { Header } from '@/components/header'

/**
 * (app) Route Group：認証必須エリアの共通レイアウト
 * ヘッダー＋認証チェック（未認証ならgetCurrentShopが/loginにredirect）
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { shop } = await getCurrentShop()
  return (
    <div className="flex flex-1 flex-col">
      <Header shopName={shop.name} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
