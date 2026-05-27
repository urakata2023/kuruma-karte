import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Vehicle } from '@/lib/types'

type CustomerLite = { name: string }
type ShopLite = { name: string; phone: string | null }

export default async function OwnerMyPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: vehicle } = await admin
    .from('vehicles')
    .select('*')
    .eq('view_token', token)
    .maybeSingle<Vehicle>()

  if (!vehicle) notFound()

  const [{ data: customer }, { data: shop }] = await Promise.all([
    admin
      .from('customers')
      .select('name')
      .eq('id', vehicle.customer_id)
      .maybeSingle<CustomerLite>(),
    admin
      .from('shops')
      .select('name, phone')
      .eq('id', vehicle.shop_id)
      .maybeSingle<ShopLite>(),
  ])

  const daysToInspection = vehicle.inspection_expires_on
    ? daysUntil(vehicle.inspection_expires_on)
    : null

  return (
    <div className="flex flex-1 flex-col">
      {/* ヘッダー */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">{shop?.name ?? '車屋'}</p>
            <p className="text-base font-semibold">{customer?.name ?? 'お客様'} 様</p>
          </div>
          <p className="text-xs text-zinc-400">愛車のマイページ</p>
        </div>
      </header>

      {/* ヒーロー：愛車写真 */}
      <section className="relative bg-gradient-to-br from-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-950">
        <div className="mx-auto max-w-2xl px-6 py-12">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
            {vehicle.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vehicle.photo_url}
                alt={vehicle.model ?? '愛車'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-zinc-400 dark:bg-zinc-900">
                <div className="text-center">
                  <p className="text-5xl">🚗</p>
                  <p className="mt-2 text-sm">写真未登録</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {vehicle.model ?? 'お車'}
            </h1>
            {vehicle.plate_number && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {vehicle.plate_number}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 次回車検カウントダウン */}
      {daysToInspection !== null && (
        <section className="mx-auto w-full max-w-2xl px-6 pt-6">
          <div
            className={`rounded-xl border p-6 text-center ${
              daysToInspection < 0
                ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950'
                : daysToInspection <= 90
                ? 'border-orange-300 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'
                : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black'
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              次回車検まで
            </p>
            <p className="mt-1 text-4xl font-bold">
              {daysToInspection < 0
                ? `${Math.abs(daysToInspection)}日 経過`
                : `あと ${daysToInspection} 日`}
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              満了予定：{formatDateJP(vehicle.inspection_expires_on!)}
            </p>
          </div>
        </section>
      )}

      {/* 車両情報 */}
      <section className="mx-auto w-full max-w-2xl px-6 py-6">
        <h2 className="mb-4 text-base font-semibold">お車の記録</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="初度登録" value={vehicle.first_registration_ym ?? '—'} />
          <Stat
            label="購入日"
            value={
              vehicle.purchased_on ? formatDateJP(vehicle.purchased_on) : '—'
            }
          />
          <Stat
            label="前回オイル交換"
            value={
              vehicle.last_oil_change_on
                ? formatDateJP(vehicle.last_oil_change_on)
                : '—'
            }
          />
          <Stat
            label="車検満了日"
            value={
              vehicle.inspection_expires_on
                ? formatDateJP(vehicle.inspection_expires_on)
                : '—'
            }
          />
        </div>
      </section>

      {/* お店情報 */}
      <section className="mx-auto w-full max-w-2xl px-6 pb-10">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
          <p className="text-xs text-zinc-500">いつもの車屋さん</p>
          <p className="mt-1 text-lg font-semibold">{shop?.name ?? '—'}</p>
          {shop?.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="mt-2 inline-block text-sm text-zinc-700 underline dark:text-zinc-300"
            >
              {shop.phone}
            </a>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            車検や整備のご相談はお気軽に。
          </p>
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
        Powered by くるまカルテ
      </footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-black">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  )
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDateJP(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${m}月${d}日`
}
