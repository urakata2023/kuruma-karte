import { LoadingOverlay } from '@/components/loading-overlay'

/**
 * お客様マイページの遷移ローディング (Phase K)
 */
export default function MyPageLoading() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center px-6">
      <LoadingOverlay label="あなたの愛車を呼び出し中" size="lg" />
    </div>
  )
}
