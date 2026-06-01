import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { THEMES } from '@/lib/themes'

export const dynamic = 'force-dynamic'

type ShopDetail = {
  id: string
  name: string
  phone: string | null
  address: string | null
  plan: string | null
  theme: string | null
  registration_token: string | null
  subscription_status: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  created_at: string
}

type CustomerLite = {
  id: string
  name: string
  phone: string | null
  email: string | null
  created_at: string
}

type VehicleLite = {
  id: string
  model: string | null
  plate_number: string | null
  inspection_expires_on: string | null
  created_at: string
}

type ActivityRow = {
  id: string
  kind: string
  message: string
  channel: string | null
  channel_status: string | null
  created_at: string
}

type NotifAggRow = {
  status: string
}

export default async function AdminShopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: shop } = await admin
    .from('shops')
    .select(
      'id, name, phone, address, plan, theme, registration_token, subscription_status, current_period_end, trial_ends_at, created_at'
    )
    .eq('id', id)
    .maybeSingle<ShopDetail>()

  if (!shop) notFound()

  const [customers, vehicles, activity, notifs] = await Promise.all([
    admin
      .from('customers')
      .select('id, name, phone, email, created_at')
      .eq('shop_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
      .returns<CustomerLite[]>(),
    admin
      .from('vehicles')
      .select('id, model, plate_number, inspection_expires_on, created_at')
      .eq('shop_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
      .returns<VehicleLite[]>(),
    admin
      .from('activity_logs')
      .select('id, kind, message, channel, channel_status, created_at')
      .eq('shop_id', id)
      .order('created_at', { ascending: false })
      .limit(30)
      .returns<ActivityRow[]>(),
    // 通知サマリー: 全件を引いて status ごとに数える（PostgRESTのGROUP BY代替）
    admin
      .from('notifications')
      .select('status, vehicles!inner(shop_id)')
      .eq('vehicles.shop_id', id)
      .returns<(NotifAggRow & { vehicles: { shop_id: string } })[]>(),
  ])

  const notifTotals = { sent: 0, failed: 0, pending: 0, cancelled: 0 }
  for (const n of notifs.data ?? []) {
    if (n.status in notifTotals) {
      notifTotals[n.status as keyof typeof notifTotals]++
    }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    'https://kuruma-karte.vercel.app'
  const registrationUrl = shop.registration_token
    ? `${baseUrl}/r/${shop.registration_token}`
    : null

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/shops"
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          ← 全店舗
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {shop.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          サインアップ {formatJP(shop.created_at)} ・ {planLabel(shop)} ・
          テーマ {themeLabel(shop.theme)}
        </p>
      </div>

      {/* プロフィール */}
      <section className="grid gap-3 md:grid-cols-2">
        <InfoCell label="電話" value={shop.phone ?? '—'} />
        <InfoCell label="住所" value={shop.address ?? '—'} />
        <InfoCell
          label="トライアル終了"
          value={shop.trial_ends_at ? formatJP(shop.trial_ends_at) : '—'}
        />
        <InfoCell
          label="現課金期間終了"
          value={shop.current_period_end ? formatJP(shop.current_period_end) : '—'}
        />
        <InfoCell
          label="顧客登録URL"
          value={registrationUrl ?? '—'}
          mono
          full
        />
      </section>

      {/* 通知サマリー */}
      <section>
        <h2 className="mb-3 text-base font-semibold">車検リマインド通知</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <NotifCell label="送信成功" value={notifTotals.sent} tone="ok" />
          <NotifCell label="失敗" value={notifTotals.failed} tone="bad" />
          <NotifCell label="待ち" value={notifTotals.pending} />
          <NotifCell label="キャンセル" value={notifTotals.cancelled} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 顧客 */}
        <section>
          <h2 className="mb-3 text-base font-semibold">
            お客様 ({customers.data?.length ?? 0}件)
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            {(customers.data ?? []).length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">
                まだお客様の登録はありません
              </p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {(customers.data ?? []).map((c) => (
                  <li key={c.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-zinc-100">{c.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {c.phone ?? '電話なし'} · {c.email ?? 'メールなし'} ·{' '}
                      {formatJP(c.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 車両 */}
        <section>
          <h2 className="mb-3 text-base font-semibold">
            車両 ({vehicles.data?.length ?? 0}件)
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            {(vehicles.data ?? []).length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-500">
                車両の登録はありません
              </p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {(vehicles.data ?? []).map((v) => (
                  <li key={v.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-zinc-100">
                      {v.model ?? '—'}{' '}
                      {v.plate_number && (
                        <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                          {v.plate_number}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      車検満了{' '}
                      {v.inspection_expires_on
                        ? formatJP(v.inspection_expires_on)
                        : '—'}{' '}
                      · 登録 {formatJP(v.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* 活動タイムライン */}
      <section>
        <h2 className="mb-3 text-base font-semibold">
          活動タイムライン (直近30件)
        </h2>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          {(activity.data ?? []).length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              活動ログはまだありません
            </p>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {(activity.data ?? []).map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-100">{a.message}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {kindLabel(a.kind)}
                        {a.channel && ` · ${a.channel}/${a.channel_status}`}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-xs text-zinc-500">
                      {formatJP(a.created_at, true)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function InfoCell({
  label,
  value,
  mono,
  full,
}: {
  label: string
  value: string
  mono?: boolean
  full?: boolean
}) {
  return (
    <div
      className={`rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 ${
        full ? 'md:col-span-2' : ''
      }`}
    >
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-sm text-zinc-100 ${mono ? 'break-all font-mono' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}

function NotifCell({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'ok' | 'bad'
}) {
  const cls =
    tone === 'ok'
      ? 'text-emerald-300'
      : tone === 'bad'
      ? 'text-red-300'
      : 'text-zinc-100'
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-center">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${cls}`}>
        {value.toLocaleString()}
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

function planLabel(shop: ShopDetail): string {
  const p = shop.plan ?? 'trial'
  if (shop.subscription_status) return `${p} (${shop.subscription_status})`
  return p
}

function kindLabel(kind: string): string {
  const map: Record<string, string> = {
    customer_added: '顧客追加',
    customer_updated: '顧客更新',
    vehicle_added: '車両追加',
    vehicle_updated: '車両更新',
    maintenance_added: '整備記録',
    maintenance_updated: '整備更新',
    maintenance_deleted: '整備削除',
    reservation_requested: '予約依頼',
    reservation_confirmed: '予約確定',
    reservation_proposed: '日時提案',
    reservation_rejected: '予約却下',
    reservation_completed: '予約完了',
    reservation_accepted_by_customer: '提案承諾',
    notification_sent: '通知送信',
    theme_changed: 'テーマ変更',
    integrations_updated: '連携設定更新',
    ai_advice_generated: 'AI提案',
  }
  return map[kind] ?? kind
}
