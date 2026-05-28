import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentShop } from '@/lib/shop'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ConfirmDeleteForm } from '@/components/confirm-delete-form'
import { deleteCustomer } from '../actions'
import { deleteVehicle } from '../../vehicles/actions'
import { CustomerTagBadges } from '@/components/customer-tag-badges'
import { CustomerTagPicker } from '@/components/customer-tag-picker'
import { CustomerTimeline } from '@/components/customer-timeline'
import { formatDateJST, formatTimeJST } from '@/lib/datetime-jp'
import type {
  Customer,
  Vehicle,
  MaintenanceRecord,
  Reservation,
} from '@/lib/types'

/**
 * 顧客詳細ページ (Phase L - C + E 統合刷新版)
 *
 * - タグ機能 (VIP/要フォロー/休眠など)
 * - タイムライン (整備記録 + 予約 + 通知履歴 を時系列統合)
 * - 新デザイントークン適用
 */
export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { shop } = await getCurrentShop()
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('shop_id', shop.id)
    .single<Customer>()

  if (!customer) notFound()

  const { data: vehiclesData } = await supabase
    .from('vehicles')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  const vehicles = (vehiclesData ?? []) as Vehicle[]
  const vehicleIds = vehicles.map((v) => v.id)
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]))

  // 整備記録 + 予約 を取得（タイムライン用）
  let maintenance: MaintenanceRecord[] = []
  let reservations: Reservation[] = []
  if (vehicleIds.length > 0) {
    const [{ data: maintData }, { data: resData }] = await Promise.all([
      admin
        .from('maintenance_records')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .order('performed_on', { ascending: false })
        .limit(50),
      admin
        .from('reservations')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    maintenance = (maintData ?? []) as MaintenanceRecord[]
    reservations = (resData ?? []) as Reservation[]
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-6 py-10">
      <div>
        <Link
          href="/customers"
          className="text-sm transition-colors hover:underline"
          style={{ color: 'var(--ink-subtle)' }}
        >
          ← お客さん一覧
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1
              className="text-headline"
              style={{ color: 'var(--ink)' }}
            >
              {customer.name} 様
            </h1>
            <CustomerTagBadges tags={customer.tags ?? []} />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href={`/customers/${customer.id}/edit`}
              className="font-medium underline"
              style={{ color: 'var(--ink-muted)' }}
            >
              編集
            </Link>
            <ConfirmDeleteForm
              action={deleteCustomer.bind(null, customer.id)}
              label={`${customer.name} 様と登録車両すべて`}
            />
          </div>
        </div>
      </div>

      {/* お客様情報 */}
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
          Customer Info
        </p>
        <h2 className="mt-1 text-title" style={{ color: 'var(--ink)' }}>
          お客さん情報
        </h2>
        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Info label="電話" value={customer.phone} />
          <Info label="メール" value={customer.email} />
          <Info label="メモ" value={customer.memo} full />
        </dl>
      </section>

      {/* タグエディタ */}
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
          Tags
        </p>
        <h2 className="mt-1 text-title" style={{ color: 'var(--ink)' }}>
          顧客タグ
        </h2>
        <p
          className="mt-1 text-xs"
          style={{ color: 'var(--ink-subtle)' }}
        >
          複数選択可能。検索やリスト絞り込みに使えます。
        </p>
        <div className="mt-4">
          <CustomerTagPicker
            customerId={customer.id}
            initialTags={customer.tags ?? []}
          />
        </div>
      </section>

      {/* 登録車両 */}
      <section
        className="rounded-xl border p-6"
        style={{
          background: 'var(--surface-1)',
          borderColor: 'var(--hairline)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-eyebrow"
              style={{ color: 'var(--ink-tertiary)' }}
            >
              Vehicles
            </p>
            <h2 className="mt-1 text-title" style={{ color: 'var(--ink)' }}>
              登録車両 ({vehicles.length}台)
            </h2>
          </div>
          <Link
            href={`/customers/${customer.id}/vehicles/new`}
            className="rounded-md px-3 py-1.5 text-sm font-semibold"
            style={{
              background: 'var(--theme-primary)',
              color: 'var(--theme-primary-fg)',
            }}
          >
            ＋ 車を追加
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <p
            className="mt-4 text-sm"
            style={{ color: 'var(--ink-subtle)' }}
          >
            まだ車が登録されていません。
          </p>
        ) : (
          <ul
            className="mt-5 divide-y"
            style={{ borderColor: 'var(--hairline)' }}
          >
            {vehicles.map((v) => (
              <li
                key={v.id}
                className="flex items-start justify-between gap-4 py-4 first:pt-0"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                    {v.model || '車種未登録'}
                  </p>
                  <p style={{ color: 'var(--ink-subtle)' }}>
                    {v.plate_number || 'ナンバー未登録'}
                  </p>
                  <p style={{ color: 'var(--ink-subtle)' }}>
                    車検満了：{formatDate(v.inspection_expires_on)}
                  </p>
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap text-sm">
                  <Link
                    href={`/vehicles/${v.id}`}
                    className="font-medium underline"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    詳細
                  </Link>
                  <a
                    href={`/my/${v.view_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                    style={{ color: 'var(--theme-accent)' }}
                  >
                    マイページ
                  </a>
                  <ConfirmDeleteForm
                    action={deleteVehicle.bind(null, v.id, customer.id)}
                    label={`${v.model || '車'}（${v.plate_number || ''}）`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 統合タイムライン (Phase L - E) */}
      <CustomerTimeline
        maintenance={maintenance}
        reservations={reservations}
        vehicleMap={
          new Map(
            vehicles.map((v) => [v.id, { model: v.model, plate: v.plate_number }])
          )
        }
      />
    </main>
  )
}

function Info({
  label,
  value,
  full,
}: {
  label: string
  value: string | null
  full?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <dt
        className="text-eyebrow"
        style={{ color: 'var(--ink-tertiary)' }}
      >
        {label}
      </dt>
      <dd
        className="mt-1 whitespace-pre-wrap text-sm"
        style={{ color: 'var(--ink)' }}
      >
        {value || '—'}
      </dd>
    </div>
  )
}

function formatDate(d: string | null): string {
  if (!d) return '未登録'
  return formatDateJST(d + 'T12:00:00Z')
}

// 未使用: formatTimeJST が他で使われていないと警告出るので silence
void formatTimeJST
