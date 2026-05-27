import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ConfirmDeleteForm } from '@/components/confirm-delete-form'
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
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10">
      <div>
        {customer && (
          <Link
            href={`/customers/${customer.id}`}
            className="text-sm text-zinc-500 hover:underline"
          >
            ← {customer.name} 様の詳細
          </Link>
        )}
        <h1 className="mt-2 text-2xl font-semibold">
          {vehicle.model || 'お車'}
        </h1>
        {vehicle.plate_number && (
          <p className="mt-1 text-sm text-zinc-500">{vehicle.plate_number}</p>
        )}
      </div>

      {/* 車両サマリー */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vehicle.photo_url ?? '/default-vehicle.svg'}
                alt={vehicle.model ?? '愛車'}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-zinc-500">
                車検満了：{formatDate(vehicle.inspection_expires_on)}
              </p>
              <p className="text-zinc-500">
                購入日：{formatDate(vehicle.purchased_on)}
              </p>
              {latestMileage != null && (
                <p className="text-zinc-500">
                  最新走行距離：
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {latestMileage.toLocaleString()} km
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 whitespace-nowrap">
            <Link
              href={`/vehicles/${vehicle.id}/edit`}
              className="text-sm font-medium underline"
            >
              車両を編集
            </Link>
            <a
              href={`/my/${vehicle.view_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 underline dark:text-blue-400"
            >
              お客様マイページ
            </a>
          </div>
        </div>
      </section>

      {/* 整備記録 */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            整備記録（{records.length}件）
          </h2>
          <Link
            href={`/vehicles/${vehicle.id}/maintenance/new`}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            ＋ 整備を記録
          </Link>
        </div>

        {records.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            まだ整備記録がありません。「＋ 整備を記録」から追加できます。
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
            {records.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{r.title}</p>
                      <span className="text-xs text-zinc-500">
                        {formatDateJP(r.performed_on)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                      {r.mileage_km != null && (
                        <span>走行距離：{r.mileage_km.toLocaleString()} km</span>
                      )}
                      {r.cost != null && (
                        <span>費用：¥{r.cost.toLocaleString()}</span>
                      )}
                    </div>
                    {r.description && (
                      <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                        {r.description}
                      </p>
                    )}
                    {r.parts && (
                      <p className="whitespace-pre-wrap text-xs text-zinc-500">
                        交換部品：{r.parts}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Link
                      href={`/vehicles/${vehicle.id}/maintenance/${r.id}/edit`}
                      className="text-sm font-medium underline"
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

function formatDate(d: string | null): string {
  if (!d) return '未登録'
  const [y, m, day] = d.split('-')
  return `${y}/${m}/${day}`
}

function formatDateJP(d: string): string {
  const [y, m, day] = d.split('-')
  return `${y}年${m}月${day}日`
}
