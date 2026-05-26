import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import Link from 'next/link'

type CustomerRow = {
  id: string
  name: string
  phone: string | null
  vehicles: { count: number }[]
}

export default async function CustomersPage() {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, name, phone, vehicles(count)')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })

  const customers = (data ?? []) as CustomerRow[]

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">お客さん一覧</h1>
        <Link
          href="/customers/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          ＋ お客さんを追加
        </Link>
      </div>

      {customers.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">お名前</th>
                <th className="px-4 py-3 font-medium">電話</th>
                <th className="px-4 py-3 font-medium">登録車両</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {c.phone || '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {c.vehicles?.[0]?.count ?? 0}台
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-sm font-medium underline"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500">まだお客さんが登録されていません。</p>
          <Link
            href="/customers/new"
            className="mt-3 inline-block text-sm font-medium underline"
          >
            最初のお客さんを追加 →
          </Link>
        </div>
      )}
    </main>
  )
}
