import { LoadingOverlay } from '@/components/loading-overlay'

/**
 * (app) 配下の共通ページ遷移ローディング (Phase K)
 *
 * Next.js App Router の規約: <Link> で遷移中に自動表示される。
 * 「クリック → 何も起きないように見える」を完全に防ぐ。
 */
export default function AppLoading() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <LoadingOverlay label="読み込み中" size="lg" />
    </div>
  )
}
