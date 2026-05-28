import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const metadata = {
  title: '活動履歴 — くるまカルテ',
}

type ActivityRow = {
  id: string
  kind: string
  target_type: string | null
  target_id: string | null
  message: string
  metadata: Record<string, unknown> | null
  channel: string | null
  channel_status: string | null
  channel_recipient: string | null
  created_at: string
}

const KIND_LABEL: Record<string, string> = {
  reservation_requested: '🔔 予約申請',
  reservation_confirmed: '✅ 予約確定',
  reservation_proposed: '📅 代替提案',
  reservation_rejected: '❌ 予約お断り',
  reservation_completed: '🏁 入庫済み',
  reservation_accepted_by_customer: '✅ お客様が再提案を承認',
  notification_sent: '📨 通知送信',
  maintenance_added: '🔧 整備記録追加',
  maintenance_updated: '🔧 整備記録更新',
  maintenance_deleted: '🗑️ 整備記録削除',
  customer_added: '👤 お客様追加',
  customer_updated: '👤 お客様情報更新',
  vehicle_added: '🚗 車両追加',
  vehicle_updated: '🚗 車両情報更新',
  ai_advice_generated: '🤖 AI整備提案生成',
  theme_changed: '🎨 テーマ変更',
  integrations_updated: '🔗 外部連携設定',
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { shop } = await getCurrentShop()
  const { filter } = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('activity_logs')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (filter && filter !== 'all') {
    if (filter === 'reservation') {
      query = query.like('kind', 'reservation%')
    } else if (filter === 'notification') {
      query = query.eq('kind', 'notification_sent')
    } else if (filter === 'maintenance') {
      query = query.like('kind', 'maintenance%')
    }
  }

  const { data } = await query
  const rows = (data ?? []) as ActivityRow[]

  // 日付ごとにグルーピング
  const byDate = new Map<string, ActivityRow[]>()
  for (const r of rows) {
    const d = r.created_at.slice(0, 10)
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push(r)
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold">📜 活動履歴</h1>
        <p className="mt-1 text-sm text-zinc-500">
          全ての操作・通知送信を時系列で確認できます。
        </p>
      </header>

      {/* フィルタ */}
      <nav className="flex flex-wrap gap-1.5">
        <FilterChip current={filter} value="all" label={`すべて (${rows.length})`} />
        <FilterChip current={filter} value="reservation" label="🗓️ 予約" />
        <FilterChip current={filter} value="notification" label="📨 通知" />
        <FilterChip current={filter} value="maintenance" label="🔧 整備" />
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          まだ履歴がありません
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(byDate.entries()).map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {formatDateJP(date)}
              </h2>
              <ul className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
                {items.map((r) => (
                  <li
                    key={r.id}
                    className="border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            {KIND_LABEL[r.kind] ?? r.kind}
                          </span>
                          {r.channel && (
                            <ChannelBadge
                              channel={r.channel}
                              status={r.channel_status}
                            />
                          )}
                        </div>
                        <p className="mt-1 text-sm">{r.message}</p>
                        {r.channel_recipient && (
                          <p className="mt-0.5 text-[10px] text-zinc-400">
                            送信先: {r.channel_recipient}
                          </p>
                        )}
                      </div>
                      <p className="whitespace-nowrap text-[10px] text-zinc-400">
                        {formatTimeJP(r.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

function FilterChip({
  current,
  value,
  label,
}: {
  current: string | undefined
  value: string
  label: string
}) {
  const active = (current ?? 'all') === value
  return (
    <Link
      href={`/activity?filter=${value}`}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
          : 'border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900'
      }`}
    >
      {label}
    </Link>
  )
}

function ChannelBadge({
  channel,
  status,
}: {
  channel: string
  status: string | null
}) {
  const channelLabel =
    channel === 'email' ? '📧 メール' : channel === 'line' ? '💬 LINE' : channel
  const isOk = status === 'sent'
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        isOk
          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
          : status === 'failed'
            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
      }`}
    >
      {channelLabel} {isOk ? '✓' : status === 'failed' ? '✗' : ''}
    </span>
  )
}

function formatDateJP(d: string): string {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10)
  if (d === today) return '今日'
  if (d === yesterday) return '昨日'
  const [y, m, day] = d.split('-')
  return `${y}年${m}月${day}日`
}

function formatTimeJP(iso: string): string {
  const dt = new Date(iso)
  const hh = String(dt.getHours()).padStart(2, '0')
  const mm = String(dt.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}
