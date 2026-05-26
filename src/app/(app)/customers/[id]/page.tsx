import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ConfirmDeleteForm } from '@/components/confirm-delete-form'
import { deleteCustomer } from '../actions'
import { deleteVehicle } from '../../vehicles/actions'
import type { Customer, Vehicle, Notification } from '@/lib/types'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

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

  // 通知履歴（その顧客の全車両分）
  let notifications: Notification[] = []
  if (vehicles.length > 0) {
    const { data: notifData } = await supabase
      .from('notifications')
      .select('*')
      .in(
        'vehicle_id',
        vehicles.map((v) => v.id)
      )
      .order('scheduled_on', { ascending: false })
      .limit(20)
    notifications = (notifData ?? []) as Notification[]
  }

  // 通知のvehicle_id→車両情報マップ
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]))

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10">
      <div>
        <Link
          href="/customers"
          className="text-sm text-zinc-500 hover:underline"
        >
          ← お客さん一覧
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{customer.name} 様</h1>
          <div className="flex items-center gap-4">
            <Link
              href={`/customers/${customer.id}/edit`}
              className="text-sm font-medium underline"
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

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
        <h2 className="text-base font-semibold">お客さん情報</h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Info label="電話" value={customer.phone} />
          <Info label="メール" value={customer.email} />
          <Info label="メモ" value={customer.memo} full />
        </dl>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            登録車両（{vehicles.length}台）
          </h2>
          <Link
            href={`/customers/${customer.id}/vehicles/new`}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            ＋ 車を追加
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            まだ車が登録されていません。
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
            {vehicles.map((v) => (
              <li key={v.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{v.model || '車種未登録'}</p>
                    <p className="text-zinc-500">
                      {v.plate_number || 'ナンバー未登録'}
                    </p>
                    <p className="text-zinc-500">
                      車検満了：{formatDate(v.inspection_expires_on)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Link
                      href={`/vehicles/${v.id}/edit`}
                      className="text-sm font-medium underline"
                    >
                      編集
                    </Link>
                    <ConfirmDeleteForm
                      action={deleteVehicle.bind(null, v.id, customer.id)}
                      label={`${v.model || '車'}（${v.plate_number || ''}）`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
        <h2 className="text-base font-semibold">
          通知履歴
          <span className="ml-2 text-xs font-normal text-zinc-500">
            （直近20件・車検3ヶ月前 / 1ヶ月前 / 2週間前に自動送信）
          </span>
        </h2>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            通知履歴はまだありません。
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {notifications.map((n) => {
              const v = vehicleMap.get(n.vehicle_id)
              return (
                <li
                  key={n.id}
                  className="flex items-start justify-between gap-3 py-3 text-sm"
                >
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">
                      {formatDate(n.scheduled_on)} ·{' '}
                      <span className={statusClass(n.status)}>
                        {statusLabel(n.status)}
                      </span>
                    </p>
                    <p className="text-zinc-500">
                      {v?.model || '車'}（{v?.plate_number || '—'}）
                      {n.channel === 'mail' && ' · メール'}
                      {n.channel === 'line' && ' · LINE'}
                    </p>
                    {n.message && (
                      <p className="text-xs text-zinc-400">{n.message}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
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
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap">{value || '—'}</dd>
    </div>
  )
}

function formatDate(d: string | null): string {
  if (!d) return '未登録'
  const [y, m, day] = d.split('-')
  return `${y}/${m}/${day}`
}

function statusLabel(s: string): string {
  switch (s) {
    case 'sent':
      return '送信済み'
    case 'pending':
      return '送信待ち'
    case 'failed':
      return '送信失敗'
    case 'cancelled':
      return 'キャンセル'
    default:
      return s
  }
}

function statusClass(s: string): string {
  switch (s) {
    case 'sent':
      return 'text-green-600 dark:text-green-400'
    case 'failed':
      return 'text-red-600 dark:text-red-400'
    case 'pending':
      return 'text-zinc-500'
    default:
      return 'text-zinc-500'
  }
}
