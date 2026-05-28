import { formatDateJST } from '@/lib/datetime-jp'
import { slotLabel } from '@/lib/reservation-slots'
import type { MaintenanceRecord, Reservation } from '@/lib/types'

/**
 * 顧客タイムライン (Phase L - E)
 *
 * 整備記録 + 予約申請/確定 を時系列にマージして表示。
 * 「いつ何があったか」が顧客視点で一覧できる。
 */

type TimelineItem = {
  date: string // YYYY-MM-DD
  kind: 'maintenance' | 'reservation'
  data: MaintenanceRecord | Reservation
}

export function CustomerTimeline({
  maintenance,
  reservations,
  vehicleMap,
}: {
  maintenance: MaintenanceRecord[]
  reservations: Reservation[]
  vehicleMap: Map<string, { model: string | null; plate: string | null }>
}) {
  // タイムライン項目を構築
  const items: TimelineItem[] = []
  for (const m of maintenance) {
    items.push({ date: m.performed_on, kind: 'maintenance', data: m })
  }
  for (const r of reservations) {
    // 予約は created_at の日付で並べる
    items.push({
      date: r.created_at.slice(0, 10),
      kind: 'reservation',
      data: r,
    })
  }
  items.sort((a, b) => b.date.localeCompare(a.date))

  return (
    <section
      className="rounded-xl border p-6"
      style={{
        background: 'var(--surface-1)',
        borderColor: 'var(--hairline)',
      }}
    >
      <p
        className="text-eyebrow"
        style={{ color: 'var(--ink-tertiary)' }}
      >
        Timeline
      </p>
      <h2 className="mt-1 text-title" style={{ color: 'var(--ink)' }}>
        タイムライン ({items.length}件)
      </h2>
      <p className="mt-1 text-xs" style={{ color: 'var(--ink-subtle)' }}>
        整備記録と予約のすべてを時系列で表示します。
      </p>

      {items.length === 0 ? (
        <p
          className="mt-5 rounded-md border border-dashed px-4 py-6 text-center text-sm"
          style={{
            borderColor: 'var(--hairline)',
            color: 'var(--ink-subtle)',
          }}
        >
          まだ履歴がありません
        </p>
      ) : (
        <ol
          className="relative mt-6 space-y-4 border-l-2 pl-5"
          style={{ borderColor: 'var(--hairline)' }}
        >
          {items.map((item, i) => (
            <li key={`${item.kind}-${i}`} className="relative">
              <span
                className="absolute -left-[26px] mt-2 h-3 w-3 rounded-full border-2"
                style={{
                  background:
                    item.kind === 'maintenance'
                      ? 'var(--theme-primary)'
                      : 'var(--theme-accent)',
                  borderColor: 'var(--surface-1)',
                }}
              />
              {item.kind === 'maintenance' ? (
                <MaintenanceItem
                  record={item.data as MaintenanceRecord}
                  vehicleMap={vehicleMap}
                />
              ) : (
                <ReservationItem
                  record={item.data as Reservation}
                  vehicleMap={vehicleMap}
                />
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function MaintenanceItem({
  record,
  vehicleMap,
}: {
  record: MaintenanceRecord
  vehicleMap: Map<string, { model: string | null; plate: string | null }>
}) {
  const v = vehicleMap.get(record.vehicle_id)
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        background: 'var(--canvas)',
        borderColor: 'var(--hairline)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-eyebrow"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          🔧 整備記録
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--ink-subtle)' }}
        >
          {formatDateJST(record.performed_on + 'T12:00:00Z')}
        </span>
      </div>
      <p
        className="mt-1.5 font-semibold"
        style={{ color: 'var(--ink)' }}
      >
        {record.title}
      </p>
      <p
        className="mt-0.5 text-xs"
        style={{ color: 'var(--ink-subtle)' }}
      >
        {v?.model ?? '車両'}
        {v?.plate && ` · ${v.plate}`}
        {record.mileage_km != null && ` · ${record.mileage_km.toLocaleString()} km`}
        {record.cost != null && ` · ¥${record.cost.toLocaleString()}`}
      </p>
      {record.description && (
        <p
          className="mt-2 whitespace-pre-wrap text-sm"
          style={{ color: 'var(--ink-muted)' }}
        >
          {record.description}
        </p>
      )}
    </div>
  )
}

function ReservationItem({
  record,
  vehicleMap,
}: {
  record: Reservation
  vehicleMap: Map<string, { model: string | null; plate: string | null }>
}) {
  const v = vehicleMap.get(record.vehicle_id)
  const status = record.status

  const statusInfo = {
    requested: { icon: '🔔', label: '予約申請' },
    pending_shop: { icon: '🔔', label: '予約申請' },
    pending_customer: { icon: '📅', label: '代替日提案中' },
    confirmed: { icon: '✅', label: '予約確定' },
    rejected: { icon: '❌', label: 'お断り' },
    completed: { icon: '🏁', label: '入庫完了' },
    cancelled: { icon: '🚫', label: 'キャンセル' },
  }[status] ?? { icon: '📌', label: '予約' }

  return (
    <div
      className="rounded-lg border p-4"
      style={{
        background: 'var(--canvas)',
        borderColor: 'var(--hairline)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-eyebrow"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          {statusInfo.icon} {statusInfo.label}
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--ink-subtle)' }}
        >
          {formatDateJST(record.created_at)}
        </span>
      </div>
      <p
        className="mt-1.5 font-semibold"
        style={{ color: 'var(--ink)' }}
      >
        {record.purpose}
      </p>
      <p
        className="mt-0.5 text-xs"
        style={{ color: 'var(--ink-subtle)' }}
      >
        {v?.model ?? '車両'}
        {v?.plate && ` · ${v.plate}`}
        {record.confirmed_date &&
          ` · 確定: ${record.confirmed_date} (${slotLabel(record.confirmed_slot)})`}
      </p>
      {record.customer_note && (
        <p
          className="mt-2 whitespace-pre-wrap text-sm"
          style={{ color: 'var(--ink-muted)' }}
        >
          {record.customer_note}
        </p>
      )}
    </div>
  )
}
