'use client'

import { useTransition } from 'react'
import { startCheckout } from './actions'

type PlanDef = {
  label: string
  price_jpy: number
  customer_limit: number | null
  features: readonly string[]
  stripe_price_id: string | null
}

export function PlanCards({
  plans,
  currentPlan,
  isOwner,
}: {
  plans: { standard: PlanDef; pro: PlanDef }
  currentPlan: string
  isOwner: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <PlanCard
        id="standard"
        plan={plans.standard}
        recommended={false}
        isCurrent={currentPlan === 'standard'}
        isOwner={isOwner}
      />
      <PlanCard
        id="pro"
        plan={plans.pro}
        recommended
        isCurrent={currentPlan === 'pro'}
        isOwner={isOwner}
      />
    </div>
  )
}

function PlanCard({
  id,
  plan,
  recommended,
  isCurrent,
  isOwner,
}: {
  id: 'standard' | 'pro'
  plan: PlanDef
  recommended: boolean
  isCurrent: boolean
  isOwner: boolean
}) {
  const [pending, startTransition] = useTransition()

  function handleCheckout() {
    if (!isOwner) {
      alert('オーナー権限が必要です')
      return
    }
    startTransition(async () => {
      try {
        await startCheckout(id)
      } catch (e) {
        alert(e instanceof Error ? e.message : 'エラー')
      }
    })
  }

  return (
    <div
      className={`relative rounded-2xl border-2 bg-white p-6 dark:bg-black ${
        recommended
          ? 'border-zinc-900 shadow-lg dark:border-white'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-3 py-1 text-[10px] font-semibold text-white dark:bg-white dark:text-black">
          ⭐ おすすめ
        </span>
      )}

      <h3 className="text-lg font-semibold">{plan.label}</h3>
      <p className="mt-2">
        <span className="text-3xl font-bold">¥{plan.price_jpy.toLocaleString()}</span>
        <span className="ml-1 text-xs text-zinc-500">/月（税別）</span>
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {plan.customer_limit
          ? `お客様 ${plan.customer_limit}名まで`
          : 'お客様 無制限'}
      </p>

      <ul className="mt-4 space-y-1.5 text-sm">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={pending || isCurrent || !isOwner}
        className={`mt-6 w-full rounded-md px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
          recommended
            ? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200'
            : 'border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900'
        }`}
      >
        {pending
          ? '処理中…'
          : isCurrent
            ? '✓ 利用中'
            : !isOwner
              ? 'オーナーのみ操作可能'
              : `${plan.label}を申し込む`}
      </button>

      {!plan.stripe_price_id && (
        <p className="mt-2 text-[10px] text-amber-600">
          ⚠️ STRIPE_PRICE_ID_{id.toUpperCase()} 未設定
        </p>
      )}
    </div>
  )
}
