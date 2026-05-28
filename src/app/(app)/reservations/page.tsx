import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { ReservationCard } from './reservation-card'
import type { Reservation } from '@/lib/types'

export const metadata = {
  title: '予約管理 — くるまカルテ',
}

type ReservationWithJoins = Reservation & {
  customer_name: string
  vehicle_model: string | null
  vehicle_plate: string | null
}

export default async function ReservationsPage() {
  const { shop } = await getCurrentShop()
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

  // ステータス別に分類
  const requested = enriched.filter((r) => r.status === 'requested')
  const confirmed = enriched.filter((r) => r.status === 'confirmed')
  const done = enriched.filter(
    (r) => r.status === 'completed' || r.status === 'rejected' || r.status === 'cancelled'
  )

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold">🗓️ 予約管理</h1>
        <p className="mt-1 text-sm text-zinc-500">
          お客様マイページからの入庫予約リクエストを管理します。
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-base font-semibold">
          🔔 承認待ち（{requested.length}件）
        </h2>
        {requested.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
            新着リクエストはありません
          </p>
        ) : (
          <ul className="space-y-3">
            {requested.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">
          ✅ 確定済み（{confirmed.length}件）
        </h2>
        {confirmed.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
            確定済みの予約はありません
          </p>
        ) : (
          <ul className="space-y-3">
            {confirmed.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold">
            📦 過去のリクエスト（{done.length}件）
          </h2>
          <ul className="space-y-2">
            {done.slice(0, 20).map((r) => (
              <li
                key={r.id}
                className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Link
                  href={`/customers/${r.customer_id}`}
                  className="font-medium hover:underline"
                >
                  {r.customer_name}
                </Link>{' '}
                <span className="text-zinc-500">
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

function statusLabel(status: Reservation['status']): string {
  switch (status) {
    case 'requested':
      return '承認待ち'
    case 'confirmed':
      return '確定済み'
    case 'rejected':
      return 'お断り'
    case 'completed':
      return '完了'
    case 'cancelled':
      return 'キャンセル'
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
