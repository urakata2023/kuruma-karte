import Link from 'next/link'
import { slotLabel } from '@/lib/reservation-slots'
import type { Reservation, DateCandidate } from '@/lib/types'

/**
 * ダッシュボード上部の「予約状況サマリ」 (Phase K)
 *
 * ファーストビューで店主に「やること」を伝える：
 * - 承認待ち件数 (赤)
 * - お客様返答待ち件数 (紫)
 * - 直近の確定予約3件
 */

type ReservationWithMeta = Reservation & {
  customer_name: string
}

export function DashboardReservationSummary({
  pendingShop,
  pendingCustomer,
  upcomingConfirmed,
}: {
  pendingShop: ReservationWithMeta[]
  pendingCustomer: ReservationWithMeta[]
  upcomingConfirmed: ReservationWithMeta[]
}) {
  const totalPending = pendingShop.length + pendingCustomer.length

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-black">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          🗓️ 予約の状況
        </h2>
        <Link
          href="/reservations"
          className="text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-400"
        >
          予約管理を見る →
        </Link>
      </div>

      {/* バッジ3つ */}
      <div className="grid grid-cols-3 divide-x divide-zinc-200 dark:divide-zinc-800">
        <Counter
          label="承認待ち"
          count={pendingShop.length}
          accent={pendingShop.length > 0 ? 'red' : 'gray'}
          subtitle="店主の返答待ち"
          href="/reservations"
        />
        <Counter
          label="お客様返答待ち"
          count={pendingCustomer.length}
          accent="purple"
          subtitle="再提案中"
          href="/reservations"
        />
        <Counter
          label="近日確定"
          count={upcomingConfirmed.length}
          accent="blue"
          subtitle="今後の入庫予定"
          href="/reservations"
        />
      </div>

      {/* 承認待ちの直近リスト */}
      {pendingShop.length > 0 && (
        <div className="border-t border-zinc-200 bg-red-50/50 px-5 py-3 dark:border-zinc-800 dark:bg-red-950/30">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
            🔔 すぐ返答が必要 ({pendingShop.length}件)
          </p>
          <ul className="space-y-1.5">
            {pendingShop.slice(0, 5).map((r) => {
              const candidates = (r.candidate_dates ??
                []) as DateCandidate[]
              const firstDate = candidates[0]?.date ?? r.desired_date
              const firstSlot = candidates[0]?.slot ?? r.desired_slot ?? 'any'
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-2 text-xs"
                >
                  <Link
                    href={`/reservations`}
                    className="font-semibold hover:underline"
                  >
                    {r.customer_name} 様
                  </Link>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {r.purpose}
                  </span>
                  <span className="text-zinc-500">
                    希望: {firstDate} ({slotLabel(firstSlot)})
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* 近日確定の直近リスト */}
      {upcomingConfirmed.length > 0 && (
        <div className="border-t border-zinc-200 bg-blue-50/50 px-5 py-3 dark:border-zinc-800 dark:bg-blue-950/30">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            ✅ 近日の入庫予定
          </p>
          <ul className="space-y-1.5">
            {upcomingConfirmed.slice(0, 5).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold">
                  {r.confirmed_date} ({slotLabel(r.confirmed_slot)})
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {r.customer_name} 様
                </span>
                <span className="text-zinc-500">{r.purpose}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* すべて0件のとき */}
      {totalPending === 0 && upcomingConfirmed.length === 0 && (
        <div className="border-t border-zinc-200 px-5 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800">
          現在、予約のリクエスト・確定予定はありません
        </div>
      )}
    </section>
  )
}

function Counter({
  label,
  count,
  accent,
  subtitle,
  href,
}: {
  label: string
  count: number
  accent: 'red' | 'purple' | 'blue' | 'gray'
  subtitle: string
  href: string
}) {
  const accentColor = {
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
    blue: 'text-blue-600 dark:text-blue-400',
    gray: 'text-zinc-600 dark:text-zinc-400',
  }[accent]

  return (
    <Link
      href={href}
      className="block px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold ${accentColor}`}>{count}</p>
      <p className="mt-0.5 text-[10px] text-zinc-400">{subtitle}</p>
    </Link>
  )
}
