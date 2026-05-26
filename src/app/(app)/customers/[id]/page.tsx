import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ConfirmDeleteForm } from '@/components/confirm-delete-form'
import { deleteCustomer } from '../actions'
import { deleteVehicle } from '../../vehicles/actions'
import type { Customer, Vehicle } from '@/lib/types'

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
          <h2 className="text-base font-semibold">登録車両（{vehicles.length}台）</h2>
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
