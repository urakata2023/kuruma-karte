import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { THEMES } from '@/lib/themes'

export const dynamic = 'force-dynamic'

type SignupRow = {
  id: string
  name: string
  plan: string | null
  theme: string | null
  created_at: string
}

type ActivityRow = {
  id: string
  shop_id: string
  kind: string
  message: string
  created_at: string
}

/**
 * /admin ダッシュボード
 *
 * 全社（全店舗）の状態を1ページで俯瞰する。営業展開フェーズで
 * 「サインアップが伸びてるか」「ちゃんと使われてるか」を即把握する。
 */
export default async function AdminDashboardPage() {
  const admin = createAdminClient()
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    shopsHead,
    customersHead,
    vehiclesHead,
    maintenanceHead,
    notificationsHead,
    signupsHead,
    recentSignups,
    recentActivity,
  ] = await Promise.all([
    admin.from('shops').select('id', { count: 'exact', head: true }),
    admin.from('customers').select('id', { count: 'exact', head: true }),
    admin.from('vehicles').select('id', { count: 'exact', head: true }),
    admin.from('maintenance_records').select('id', { count: 'exact', head: true }),
    admin.from('notifications').select('id', { count: 'exact', head: true }),
    admin
      .from('shops')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString()),
    admin
      .from('shops')
      .select('id, name, plan, theme, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
      .returns<SignupRow[]>(),
    admin
      .from('activity_logs')
      .select('id, shop_id, kind, message, created_at')
      .order('created_at', { ascending: false })
      .limit(15)
      .returns<ActivityRow[]>(),
  ])

  const shopIds = Array.from(
    new Set(recentActivity.data?.map((r) => r.shop_id) ?? [])
  )
  const { data: shopNameRows } = await admin
    .from('shops')
    .select('id, name')
    .in('id', shopIds.length > 0 ? shopIds : ['00000000-0000-0000-0000-000000000000'])
  const shopNameMap = new Map<string, string>(
    (shopNameRows ?? []).map((s) => [s.id as string, s.name as string])
  )

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">俯瞰ダッシュボード</h1>
        <p className="mt-1 text-sm text-zinc-500">
          全店舗の利用状況をリアルタイムで把握する場所。営業フォローの判断はここから。
        </p>
      </div>

      {/* グローバル KPI */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi label="登録店舗" value={shopsHead.count ?? 0} accent />
        <Kpi label="累計お客様" value={customersHead.count ?? 0} />
        <Kpi label="累計車両" value={vehiclesHead.count ?? 0} />
        <Kpi label="整備記録" value={maintenanceHead.count ?? 0} />
        <Kpi label="通知送信" value={notificationsHead.count ?? 0} />
        <Kpi
          label="新規(7日)"
          value={signupsHead.count ?? 0}
          accent
          suffix="店舗"
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 直近サインアップ */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold">直近のサインアップ</h2>
            <Link
              href="/admin/shops"
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              全店舗を見る →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            {(recentSignups.data ?? []).length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">
                まだサインアップはありません
              </p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {(recentSignups.data ?? []).map((s) => (
                  <li key={s.id} className="px-4 py-3">
                    <Link
                      href={`/admin/shops/${s.id}`}
                      className="flex items-center justify-between gap-3 hover:bg-zinc-900/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-100">
                          {s.name}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {formatJP(s.created_at)} · {planLabel(s.plan)} ·{' '}
                          {themeLabel(s.theme)}
                        </p>
                      </div>
                      <span className="text-xs text-zinc-600">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 直近の活動 */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold">直近の活動ログ</h2>
            <span className="text-xs text-zinc-500">全店舗横断</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            {(recentActivity.data ?? []).length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">
                活動ログはまだありません
              </p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {(recentActivity.data ?? []).map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-zinc-100">
                          {a.message}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {shopNameMap.get(a.shop_id) ?? '不明な店舗'} ·{' '}
                          {kindLabel(a.kind)} · {formatJP(a.created_at, true)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  suffix,
  accent,
}: {
  label: string
  value: number
  suffix?: string
  accent?: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 ${
        accent
          ? 'border-amber-700/40 bg-amber-900/10'
          : 'border-zinc-800 bg-zinc-900/40'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-100">
        {value.toLocaleString()}
        {suffix && (
          <span className="ml-1 text-sm font-normal text-zinc-400">
            {suffix}
          </span>
        )}
      </p>
    </div>
  )
}

function formatJP(iso: string, withTime = false): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (!withTime) return `${y}/${m}/${day}`
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${day} ${hh}:${mm}`
}

function themeLabel(id: string | null): string {
  if (!id) return 'default'
  const t = THEMES.find((t) => t.id === id)
  return t?.name ?? id
}

function planLabel(plan: string | null): string {
  if (!plan) return 'trial'
  return plan
}

function kindLabel(kind: string): string {
  const map: Record<string, string> = {
    customer_added: '顧客追加',
    vehicle_added: '車両追加',
    maintenance_added: '整備記録',
    maintenance_updated: '整備更新',
    reservation_requested: '予約依頼',
    reservation_confirmed: '予約確定',
    reservation_proposed: '日時提案',
    reservation_completed: '予約完了',
    notification_sent: '通知送信',
    theme_changed: 'テーマ変更',
    ai_advice_generated: 'AI提案',
  }
  return map[kind] ?? kind
}
