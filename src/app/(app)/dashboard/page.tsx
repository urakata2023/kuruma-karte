import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import Link from 'next/link'
import { QrDisplay } from '@/components/qr-display'

type ThisMonthVehicle = {
  id: string
  model: string | null
  plate_number: string | null
  inspection_expires_on: string | null
  customer_id: string
}

type CustomerLite = {
  id: string
  name: string
  phone: string | null
}

export default async function DashboardPage() {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10)

  const [customersR, vehiclesR, thisMonthR] = await Promise.all([
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shop.id),
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shop.id),
    supabase
      .from('vehicles')
      .select('id, model, plate_number, inspection_expires_on, customer_id')
      .eq('shop_id', shop.id)
      .gte('inspection_expires_on', monthStart)
      .lte('inspection_expires_on', monthEnd)
      .order('inspection_expires_on', { ascending: true }),
  ])

  const customerCount = customersR.count ?? 0
  const vehicleCount = vehiclesR.count ?? 0
  const thisMonthVehicles = (thisMonthR.data ?? []) as ThisMonthVehicle[]

  // 顧客名を1クエリで取得してマップ化（Supabase外部キー埋め込みは型がブレるためN+1回避の自前JOIN）
  const customerMap = new Map<string, CustomerLite>()
  const customerIds = thisMonthVehicles.map((v) => v.customer_id)
  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, phone')
      .in('id', customerIds)
    for (const c of (customers ?? []) as CustomerLite[]) {
      customerMap.set(c.id, c)
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="お客さん" value={`${customerCount}人`} />
        <Stat label="登録車両" value={`${vehicleCount}台`} />
        <Stat label="今月車検" value={`${thisMonthVehicles.length}台`} />
      </section>

      <RegistrationQrSection
        token={shop.registration_token}
        shopName={shop.name}
      />

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">◆ 今月、車検が来るお客さん</h2>
          <Link
            href="/customers"
            className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            お客さん一覧 →
          </Link>
        </div>
        {thisMonthVehicles.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            今月、車検が来る車はありません。
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {thisMonthVehicles.map((v) => {
              const customer = customerMap.get(v.customer_id)
              return (
                <li
                  key={v.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <Link
                      href={`/customers/${v.customer_id}`}
                      className="font-medium hover:underline"
                    >
                      {customer?.name ?? '—'} 様
                    </Link>
                    <p className="text-zinc-500">
                      {v.model || '車種不明'} / {v.plate_number || 'ナンバー未登録'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDate(v.inspection_expires_on)}</p>
                    <p className="text-xs text-zinc-500">満了予定</p>
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

async function RegistrationQrSection({
  token,
  shopName,
}: {
  token: string
  shopName: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const registrationUrl = `${appUrl}/r/${token}`

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
      <h2 className="text-base font-semibold">
        ◆ お客様向け 登録QR・URL
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        このQR / URL をお客様に渡すと、お客様自身が愛車を{shopName}に登録できます。
      </p>
      <div className="mt-4 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <QrDisplay text={registrationUrl} />
        <div className="flex-1 space-y-2">
          <p className="text-xs text-zinc-500">登録URL</p>
          <code className="block break-all rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {registrationUrl}
          </code>
          <p className="text-xs text-zinc-500">
            ※ このURLは推測されないランダムな値です。お客様だけにお渡しください。
          </p>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${y}/${m}/${day}`
}
