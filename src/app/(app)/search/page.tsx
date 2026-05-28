import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const metadata = {
  title: '検索 — くるまカルテ',
}

type CustomerHit = {
  id: string
  name: string
  phone: string | null
  email: string | null
}

type VehicleHit = {
  id: string
  model: string | null
  plate_number: string | null
  customer_id: string
  view_token: string
  inspection_expires_on: string | null
}

/**
 * 顧客横断検索 (Phase 12-1)
 *
 * 検索対象：
 * - customers.name / phone / email
 * - vehicles.model / plate_number
 *
 * シンプルに ILIKE で部分一致。今後 PG の全文検索 (tsvector) に切り替え可能。
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q ?? '').trim()

  if (!query) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">🔍 検索</h1>
        <p className="mt-3 text-sm text-zinc-500">
          ヘッダー上部の検索バーに、顧客名・電話番号・ナンバー・車種を入れて検索してください。
        </p>
      </main>
    )
  }

  const { shop } = await getCurrentShop()
  const admin = createAdminClient()
  const pattern = `%${query}%`

  // 顧客検索 (name / phone / email)
  const { data: customerRows } = await admin
    .from('customers')
    .select('id, name, phone, email')
    .eq('shop_id', shop.id)
    .or(
      `name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`
    )
    .limit(20)

  const customers = (customerRows ?? []) as CustomerHit[]

  // 車両検索 (model / plate_number)
  const { data: vehicleRows } = await admin
    .from('vehicles')
    .select(
      'id, model, plate_number, customer_id, view_token, inspection_expires_on'
    )
    .eq('shop_id', shop.id)
    .or(`model.ilike.${pattern},plate_number.ilike.${pattern}`)
    .limit(20)

  const vehicles = (vehicleRows ?? []) as VehicleHit[]

  // 車両ヒットに紐づく顧客名を取得
  const vehicleCustomerIds = Array.from(
    new Set(vehicles.map((v) => v.customer_id))
  ).filter((id) => !customers.some((c) => c.id === id))

  let vehicleCustomerMap = new Map<string, string>()
  if (vehicleCustomerIds.length > 0) {
    const { data: extraCustomers } = await admin
      .from('customers')
      .select('id, name')
      .in('id', vehicleCustomerIds)
    for (const c of (extraCustomers ?? []) as { id: string; name: string }[]) {
      vehicleCustomerMap.set(c.id, c.name)
    }
  }
  for (const c of customers) {
    vehicleCustomerMap.set(c.id, c.name)
  }

  const totalHits = customers.length + vehicles.length

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-6">
        <p className="text-xs text-zinc-500">検索結果</p>
        <h1 className="mt-1 text-2xl font-semibold">
          「{query}」 <span className="text-zinc-500">— {totalHits}件</span>
        </h1>
      </header>

      {totalHits === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          該当する結果がありませんでした
          <br />
          <span className="text-xs">
            別のキーワード（ひらがな↔カタカナ、漢字↔ローマ字）でも試してみてください
          </span>
        </div>
      )}

      {customers.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-zinc-500">
            お客さん（{customers.length}件）
          </h2>
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-black">
            {customers.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/customers/${c.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {c.phone || c.email || '連絡先未登録'}
                    </p>
                  </div>
                  <span className="text-zinc-400">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {vehicles.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-500">
            車両（{vehicles.length}件）
          </h2>
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-black">
            {vehicles.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/vehicles/${v.id}`}
                  className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div>
                    <p className="font-semibold">
                      {v.model ?? '車種未登録'}
                      {v.plate_number && (
                        <span className="ml-2 text-xs font-normal text-zinc-500">
                          {v.plate_number}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {vehicleCustomerMap.get(v.customer_id) ?? '所有者不明'} 様
                      {v.inspection_expires_on && (
                        <span className="ml-2 text-zinc-400">
                          車検満了：{v.inspection_expires_on}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-zinc-400">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
