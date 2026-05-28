import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { ConfirmDeleteForm } from '@/components/confirm-delete-form'
import { MaintenanceRecommendationsShopAsync } from '@/components/maintenance-recommendations-async'
import { deleteMaintenanceRecord } from './maintenance/actions'
import type { Vehicle, Customer, MaintenanceRecord } from '@/lib/types'

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .eq('shop_id', shop.id)
    .single<Vehicle>()

  if (!vehicle) notFound()

  const [{ data: customer }, { data: recordsData }] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name')
      .eq('id', vehicle.customer_id)
      .single<Pick<Customer, 'id' | 'name'>>(),
    supabase
      .from('maintenance_records')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('performed_on', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  const records = (recordsData ?? []) as MaintenanceRecord[]
  const latestMileage = records.find((r) => r.mileage_km != null)?.mileage_km

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10">
      <div>
        {customer && (
          <Link
            href={`/customers/${customer.id}`}
            className="text-sm hover:underline"
            style={{ color: 'var(--ink-subtle)' }}
          >
            ← {customer.name} 様の詳細
          </Link>
        )}
        <p
          className="mt-3 text-eyebrow"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          Vehicle
        </p>
        <h1
          className="mt-1 text-headline"
          style={{ color: 'var(--ink)' }}
        >
          {vehicle.model || 'お車'}
        </h1>
        {vehicle.plate_number && (
          <p
            className="mt-1 text-sm tabular-figs"
            style={{ color: 'var(--ink-subtle)' }}
          >
            {vehicle.plate_number}
          </p>
        )}
      </div>

      {/* 車両サマリー */}
      <section
        className="rounded-xl border p-6"
        style={{
          background: 'var(--surface-1)',
          borderColor: 'var(--hairline)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div
              className="relative h-28 w-36 flex-shrink-0 overflow-hidden rounded-lg border"
              style={{ borderColor: 'var(--hairline)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vehicle.photo_url ?? '/default-vehicle.svg'}
                alt={vehicle.model ?? '愛車'}
                className="h-full w-full object-cover"
              />
            </div>
            <dl className="space-y-2 text-sm">
              <Field
                label="車検満了"
                value={formatDate(vehicle.inspection_expires_on)}
              />
              <Field
                label="購入日"
                value={formatDate(vehicle.purchased_on)}
              />
              {latestMileage != null && (
                <Field
                  label="最新走行距離"
                  value={`${latestMileage.toLocaleString()} km`}
                  emphasis
                />
              )}
            </dl>
          </div>
          <div className="flex flex-col items-end gap-2 whitespace-nowrap">
            <Link
              href={`/vehicles/${vehicle.id}/edit`}
              className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                borderColor: 'var(--hairline)',
                color: 'var(--ink-muted)',
              }}
            >
              車両を編集
            </Link>
            <a
              href={`/my/${vehicle.view_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-3 py-1.5 text-xs font-semibold"
              style={{
                background: 'var(--theme-accent)',
                color: 'var(--theme-accent-fg)',
              }}
            >
              お客様マイページ ↗
            </a>
          </div>
        </div>
      </section>

      {/* AIアシスタント (Phase 11) — 店主向け次の一手 */}
      <Suspense
        fallback={
          <div
            className="rounded-xl border border-dashed px-4 py-5 text-center text-xs"
            style={{
              borderColor: 'var(--hairline)',
              background: 'var(--surface-2)',
              color: 'var(--ink-subtle)',
            }}
          >
            🤖 AIが {customer?.name ?? 'お客様'} 様への提案を考えています…
          </div>
        }
      >
        <MaintenanceRecommendationsShopAsync
          vehicle={vehicle}
          records={records}
          customerName={customer?.name ?? 'お客様'}
        />
      </Suspense>

      {/* 整備記録 */}
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
              Maintenance Records
            </p>
            <h2 className="mt-1 text-title" style={{ color: 'var(--ink)' }}>
              整備記録 ({records.length}件)
            </h2>
          </div>
          <Link
            href={`/vehicles/${vehicle.id}/maintenance/new`}
            className="rounded-md px-3 py-1.5 text-sm font-semibold"
            style={{
              background: 'var(--theme-primary)',
              color: 'var(--theme-primary-fg)',
            }}
          >
            ＋ 整備を記録
          </Link>
        </div>

        {records.length === 0 ? (
          <p
            className="mt-4 text-sm"
            style={{ color: 'var(--ink-subtle)' }}
          >
            まだ整備記録がありません。「＋ 整備を記録」から追加できます。
          </p>
        ) : (
          <ul
            className="mt-5 divide-y"
            style={{ borderColor: 'var(--hairline)' }}
          >
            {records.map((r) => (
              <li key={r.id} className="py-4 first:pt-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <p
                        className="font-semibold"
                        style={{ color: 'var(--ink)' }}
                      >
                        {r.title}
                      </p>
                      <span
                        className="text-xs tabular-figs"
                        style={{ color: 'var(--ink-subtle)' }}
                      >
                        {formatDateJP(r.performed_on)}
                      </span>
                      <span
                        className="text-xs tabular-figs"
                        style={{ color: 'var(--ink-tertiary)' }}
                      >
                        記録：{formatDateTimeJP(r.created_at)}
                      </span>
                    </div>
                    <div
                      className="flex flex-wrap gap-3 text-xs tabular-figs"
                      style={{ color: 'var(--ink-subtle)' }}
                    >
                      {r.mileage_km != null && (
                        <span>走行距離：{r.mileage_km.toLocaleString()} km</span>
                      )}
                      {r.cost != null && (
                        <span>費用：¥{r.cost.toLocaleString()}</span>
                      )}
                    </div>
                    {r.description && (
                      <p
                        className="whitespace-pre-wrap text-sm"
                        style={{ color: 'var(--ink-muted)' }}
                      >
                        {r.description}
                      </p>
                    )}
                    {r.parts && (
                      <p
                        className="whitespace-pre-wrap text-xs"
                        style={{ color: 'var(--ink-subtle)' }}
                      >
                        交換部品：{r.parts}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Link
                      href={`/vehicles/${vehicle.id}/maintenance/${r.id}/edit`}
                      className="text-sm font-medium underline"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      編集
                    </Link>
                    <ConfirmDeleteForm
                      action={deleteMaintenanceRecord.bind(
                        null,
                        r.id,
                        vehicle.id
                      )}
                      label={`${r.title}（${formatDateJP(r.performed_on)}）`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function Field({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div>
      <dt
        className="text-eyebrow"
        style={{ color: 'var(--ink-tertiary)' }}
      >
        {label}
      </dt>
      <dd
        className="mt-0.5"
        style={{
          color: emphasis ? 'var(--ink)' : 'var(--ink-muted)',
          fontWeight: emphasis ? 600 : 400,
        }}
      >
        {value}
      </dd>
    </div>
  )
}

function formatDate(d: string | null): string {
  if (!d) return '未登録'
  const [y, m, day] = d.split('-')
  return `${y}/${m}/${day}`
}

function formatDateJP(d: string): string {
  const [y, m, day] = d.split('-')
  return `${y}年${m}月${day}日`
}

function formatDateTimeJP(isoStr: string): string {
  const d = new Date(isoStr)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${mo}/${da} ${hh}:${mm}`
}
