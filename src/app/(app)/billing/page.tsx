import { getCurrentShop } from '@/lib/shop'
import { PLANS } from '@/lib/stripe'
import { PlanCards } from './plan-cards'
import { PortalButton } from './portal-button'

export const metadata = {
  title: '料金プラン — くるまカルテ',
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const { shop, role } = await getCurrentShop()
  const { checkout } = await searchParams

  const trialEndsAt = shop.trial_ends_at
    ? new Date(shop.trial_ends_at as unknown as string)
    : null
  const trialRemaining = trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (trialEndsAt.getTime() - Date.now()) / (24 * 3600 * 1000)
        )
      )
    : null

  const currentPlan = shop.plan ?? 'trial'
  const isActiveSubscription =
    shop.subscription_status === 'active' ||
    shop.subscription_status === 'trialing'

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10">
      <header>
        <p className="text-xs text-zinc-500">設定 / 料金プラン</p>
        <h1 className="mt-1 text-2xl font-semibold">💳 料金プラン・お支払い</h1>
      </header>

      {checkout === 'success' && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300">
          ✓ お支払い処理が完了しました。ご契約ありがとうございます！
        </div>
      )}
      {checkout === 'cancel' && (
        <div className="rounded-md border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
          チェックアウトをキャンセルしました。
        </div>
      )}

      {/* 現プラン表示 */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
        <p className="text-xs text-zinc-500">現在のプラン</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <span className="text-2xl font-semibold">
            {currentPlan === 'trial'
              ? '🎁 無料トライアル'
              : currentPlan === 'standard'
                ? '⚡ スタンダード'
                : currentPlan === 'pro'
                  ? '🚀 プロ'
                  : currentPlan}
          </span>
          {trialRemaining !== null && currentPlan === 'trial' && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              トライアル残り {trialRemaining}日
            </span>
          )}
          {shop.subscription_status === 'past_due' && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
              ⚠️ お支払い失敗
            </span>
          )}
        </div>

        {isActiveSubscription && shop.stripe_customer_id && (
          <div className="mt-4">
            <PortalButton />
          </div>
        )}
      </section>

      {/* プラン選択 */}
      <section>
        <h2 className="mb-4 text-base font-semibold">プランを選ぶ</h2>
        <PlanCards
          plans={PLANS}
          currentPlan={currentPlan}
          isOwner={role === 'owner'}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-xs dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-semibold">📋 ご利用にあたって</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-400">
          <li>新規ご登録から30日間は全機能を無料でお試しいただけます</li>
          <li>トライアル終了後も自動課金はされません（手動で選択）</li>
          <li>いつでも変更・解約可能（次回更新まで現プラン利用可）</li>
          <li>請求書はStripe顧客ポータルからダウンロードできます</li>
          <li>領収書は登録メールアドレスにPDFが届きます</li>
        </ul>
      </section>
    </main>
  )
}
