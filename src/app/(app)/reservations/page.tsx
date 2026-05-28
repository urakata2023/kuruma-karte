import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { ReservationCard } from './reservation-card'
import type { Reservation } from '@/lib/types'
import { ToastBanner } from '@/components/toast-banner'

export const metadata = {
  title: '予約管理 — くるまカルテ',
}

type ReservationWithJoins = Reservation & {
  customer_name: string
  vehicle_model: string | null
  vehicle_plate: string | null
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ toast?: string; msg?: string }>
}) {
  const { shop } = await getCurrentShop()
  const { toast, msg } = await searchParams
  const admin = createAdminClient()

  const { data: reservationsData } = await admin
    .from('reservations')
    .select('*')
    .eq('shop_id', shop.id)
    .order('desired_date', { ascending: true })
    .order('created_at', { ascending: false })

  const reservations = (reservationsData ?? []) as Reservation[]

  // 顧客名と車両情報を別途取得
  const customerIds = Array.from(new Set(reservations.map((r) => r.customer_id)))
  const vehicleIds = Array.from(new Set(reservations.map((r) => r.vehicle_id)))

  const [customerMap, vehicleMap] = await Promise.all([
    fetchMap<{ id: string; name: string }>(
      admin,
      'customers',
      'id, name',
      customerIds
    ),
    fetchMap<{ id: string; model: string | null; plate_number: string | null }>(
      admin,
      'vehicles',
      'id, model, plate_number',
      vehicleIds
    ),
  ])

  const enriched: ReservationWithJoins[] = reservations.map((r) => ({
    ...r,
    customer_name: customerMap.get(r.customer_id)?.name ?? '—',
    vehicle_model: vehicleMap.get(r.vehicle_id)?.model ?? null,
    vehicle_plate: vehicleMap.get(r.vehicle_id)?.plate_number ?? null,
  }))

  // ステータス別に分類 (Phase G)
  const requested = enriched.filter(
    (r) => r.status === 'requested' || r.status === 'pending_shop'
  )
  const pendingCustomer = enriched.filter(
    (r) => r.status === 'pending_customer'
  )
  const confirmed = enriched.filter((r) => r.status === 'confirmed')
  const done = enriched.filter(
    (r) =>
      r.status === 'completed' ||
      r.status === 'rejected' ||
      r.status === 'cancelled'
  )

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-6 py-10">
      {(toast === 'ok' || toast === 'err') && msg && (
        <ToastBanner type={toast} message={msg} />
      )}

      <header className="space-y-1">
        <p className="text-eyebrow" style={{ color: 'var(--ink-tertiary)' }}>
          Reservations
        </p>
        <h1 className="text-headline" style={{ color: 'var(--ink)' }}>
          🗓️ 予約管理
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-subtle)' }}>
          お客様マイページからの入庫予約リクエストを管理します。
        </p>
      </header>

      <SectionGroup
        title="🔔 承認待ち"
        count={requested.length}
        emptyText="新着リクエストはありません"
        accent="red"
      >
        {requested.map((r) => (
          <ReservationCard key={r.id} reservation={r} />
        ))}
      </SectionGroup>

      <SectionGroup
        title="📨 お客様返答待ち"
        count={pendingCustomer.length}
        emptyText="再提案中の予約はありません"
        accent="purple"
      >
        {pendingCustomer.map((r) => (
          <ReservationCard key={r.id} reservation={r} />
        ))}
      </SectionGroup>

      <SectionGroup
        title="✅ 確定済み"
        count={confirmed.length}
        emptyText="確定済みの予約はありません"
        accent="blue"
      >
        {confirmed.map((r) => (
          <ReservationCard key={r.id} reservation={r} />
        ))}
      </SectionGroup>

      {done.length > 0 && (
        <section>
          <h2
            className="mb-3 text-eyebrow"
            style={{ color: 'var(--ink-tertiary)' }}
          >
            📦 過去のリクエスト ({done.length}件)
          </h2>
          <ul className="space-y-2">
            {done.slice(0, 20).map((r) => (
              <li
                key={r.id}
                className="rounded-lg border px-4 py-3 text-sm"
                style={{
                  background: 'var(--surface-2)',
                  borderColor: 'var(--hairline)',
                }}
              >
                <Link
                  href={`/customers/${r.customer_id}`}
                  className="font-medium hover:underline"
                  style={{ color: 'var(--ink)' }}
                >
                  {r.customer_name}
                </Link>{' '}
                <span style={{ color: 'var(--ink-subtle)' }}>
                  / {r.vehicle_model ?? '車両'} / {r.purpose} ·{' '}
                  {statusLabel(r.status)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

function SectionGroup({
  title,
  count,
  emptyText,
  accent,
  children,
}: {
  title: string
  count: number
  emptyText: string
  accent: 'red' | 'purple' | 'blue'
  children: React.ReactNode
}) {
  const dotColor = {
    red: '#ef4444',
    purple: '#a855f7',
    blue: '#3b82f6',
  }[accent]
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: dotColor }}
        />
        <h2
          className="text-eyebrow"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          {title}
          <span
            className="ml-1.5 tabular-figs"
            style={{ color: 'var(--ink)' }}
          >
            {count}
          </span>
        </h2>
      </div>
      {count === 0 ? (
        <p
          className="rounded-lg border border-dashed p-4 text-sm"
          style={{
            borderColor: 'var(--hairline)',
            color: 'var(--ink-subtle)',
          }}
        >
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-3">{children}</ul>
      )}
    </section>
  )
}

function statusLabel(status: Reservation['status']): string {
  switch (status) {
    case 'requested':
    case 'pending_shop':
      return '承認待ち'
    case 'pending_customer':
      return 'お客様返答待ち'
    case 'confirmed':
      return '確定済み'
    case 'rejected':
      return 'お断り'
    case 'completed':
      return '完了'
    case 'cancelled':
      return 'キャンセル'
    default:
      return status
  }
}

async function fetchMap<T extends { id: string }>(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  select: string,
  ids: string[]
): Promise<Map<string, T>> {
  const m = new Map<string, T>()
  if (ids.length === 0) return m
  const { data } = await admin.from(table).select(select).in('id', ids)
  for (const row of (data ?? []) as unknown as T[]) {
    m.set(row.id, row)
  }
  return m
}
