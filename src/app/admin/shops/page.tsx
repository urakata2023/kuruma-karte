import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { THEMES } from '@/lib/themes'

export const dynamic = 'force-dynamic'

type ShopRow = {
  id: string
  name: string
  phone: string | null
  plan: string | null
  theme: string | null
  subscription_status: string | null
  trial_ends_at: string | null
  created_at: string
}

type CountAgg = { shop_id: string; count: number }

/**
 * /admin/shops 全店舗テーブル
 *
 * 「営業して→サインアップ→使い始め」の漏斗を1画面で。
 * 顧客0台 / 整備0件 / 最終活動から30日以上 → 架電フォロー候補。
 */
export default async function AdminShopsPage() {
  const admin = createAdminClient()

  const { data: shops } = await admin
    .from('shops')
    .select(
      'id, name, phone, plan, theme, subscription_status, trial_ends_at, created_at'
    )
    .order('created_at', { ascending: false })
    .returns<ShopRow[]>()

  const shopIds = (shops ?? []).map((s) => s.id)
  if (shopIds.length === 0) {
    return <EmptyState />
  }

  // shop_id ごとの集計（PostgRESTでは GROUP BY 直接できないのでクライアント側で集計）
  const [customers, vehicles, records, lastActivity] = await Promise.all([
    admin
      .from('customers')
      .select('shop_id')
      .in('shop_id', shopIds)
      .returns<{ shop_id: string }[]>(),
    admin
      .from('vehicles')
      .select('shop_id')
      .in('shop_id', shopIds)
      .returns<{ shop_id: string }[]>(),
    admin
      .from('maintenance_records')
      .select('shop_id')
      .in('shop_id', shopIds)
      .returns<{ shop_id: string }[]>(),
    admin
      .from('activity_logs')
      .select('shop_id, created_at')
      .in('shop_id', shopIds)
      .order('created_at', { ascending: false })
      .returns<{ shop_id: string; created_at: string }[]>(),
  ])

  const customerCount = countBy(customers.data ?? [])
  const vehicleCount = countBy(vehicles.data ?? [])
  const recordCount = countBy(records.data ?? [])
  const lastActiveAt = new Map<string, string>()
  for (const row of lastActivity.data ?? []) {
    if (!lastActiveAt.has(row.shop_id)) {
      lastActiveAt.set(row.shop_id, row.created_at)
    }
  }

  const now = Date.now()
  const rows = (shops ?? []).map((s) => {
    const last = lastActiveAt.get(s.id) ?? null
    const daysSinceActive = last
      ? Math.floor((now - new Date(last).getTime()) / 86_400_000)
      : null
    const cust = customerCount.get(s.id) ?? 0
    const veh = vehicleCount.get(s.id) ?? 0
    const rec = recordCount.get(s.id) ?? 0
    const status: 'active' | 'idle' | 'dormant' =
      daysSinceActive == null
        ? 'idle'
        : daysSinceActive <= 7
        ? 'active'
        : daysSinceActive >= 30
        ? 'dormant'
        : 'idle'
    return { shop: s, cust, veh, rec, last, daysSinceActive, status }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">全店舗</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {rows.length}店舗 ・ 🟢アクティブ {rows.filter((r) => r.status === 'active').length} ・
            🟡未使用 {rows.filter((r) => r.status === 'idle').length} ・
            ⚫休眠 {rows.filter((r) => r.status === 'dormant').length}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">店舗</th>
              <th className="px-4 py-3 text-left font-medium">サインアップ</th>
              <th className="px-4 py-3 text-left font-medium">プラン</th>
              <th className="px-4 py-3 text-left font-medium">テーマ</th>
              <th className="px-4 py-3 text-right font-medium">顧客</th>
              <th className="px-4 py-3 text-right font-medium">車両</th>
              <th className="px-4 py-3 text-right font-medium">整備</th>
              <th className="px-4 py-3 text-left font-medium">最終活動</th>
              <th className="px-4 py-3 text-left font-medium">状態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.shop.id} className="hover:bg-zinc-900/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/shops/${r.shop.id}`}
                    className="font-medium text-zinc-100 hover:text-amber-300"
                  >
                    {r.shop.name}
                  </Link>
                  {r.shop.phone && (
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {r.shop.phone}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {formatJP(r.shop.created_at)}
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  <PlanBadge plan={r.shop.plan} status={r.shop.subscription_status} />
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {themeLabel(r.shop.theme)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-100">
                  {r.cust}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-100">
                  {r.veh}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-100">
                  {r.rec}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {r.last ? relativeJP(r.daysSinceActive!) : '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-600">
        状態は「最終活動ログ」で判定：7日以内=🟢アクティブ / 8〜29日=🟡未使用 / 30日以上=⚫休眠 / ログ無し=🟡未使用
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-zinc-800 px-6 py-16 text-center">
      <p className="text-sm text-zinc-400">
        まだサインアップしている店舗はありません。
      </p>
      <p className="mt-2 text-xs text-zinc-600">
        営業展開して最初の登録を待ちましょう。
      </p>
    </div>
  )
}

function PlanBadge({
  plan,
  status,
}: {
  plan: string | null
  status: string | null
}) {
  const p = plan ?? 'trial'
  const subText = status ? `${p} · ${status}` : p
  const tone =
    p === 'pro'
      ? 'border-amber-700/40 bg-amber-900/20 text-amber-200'
      : p === 'standard'
      ? 'border-emerald-700/40 bg-emerald-900/20 text-emerald-200'
      : 'border-zinc-700 bg-zinc-800/40 text-zinc-300'
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tone}`}
    >
      {subText}
    </span>
  )
}

function StatusPill({ status }: { status: 'active' | 'idle' | 'dormant' }) {
  if (status === 'active')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        アクティブ
      </span>
    )
  if (status === 'dormant')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
        <span className="h-2 w-2 rounded-full bg-zinc-600" />
        休眠
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-amber-300">
      <span className="h-2 w-2 rounded-full bg-amber-400" />
      未使用
    </span>
  )
}

function countBy(rows: { shop_id: string }[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of rows) m.set(r.shop_id, (m.get(r.shop_id) ?? 0) + 1)
  return m
}

function formatJP(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
    d.getDate()
  ).padStart(2, '0')}`
}

function relativeJP(days: number): string {
  if (days <= 0) return '今日'
  if (days === 1) return '昨日'
  if (days < 7) return `${days}日前`
  if (days < 30) return `${Math.floor(days / 7)}週間前`
  if (days < 365) return `${Math.floor(days / 30)}ヶ月前`
  return `${Math.floor(days / 365)}年前`
}

function themeLabel(id: string | null): string {
  if (!id) return 'default'
  const t = THEMES.find((t) => t.id === id)
  return t?.name ?? id
}

// CountAgg は将来の最適化（DBビュー化）用に型だけ残す
export type { CountAgg }
