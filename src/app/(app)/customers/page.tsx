import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import Link from 'next/link'
import { CustomerTagBadges } from '@/components/customer-tag-badges'

type CustomerRow = {
  id: string
  name: string
  phone: string | null
  tags: string[] | null
  vehicles: { count: number }[]
}

export default async function CustomersPage() {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()
  const { data } = await supabase
    .from('customers')
    .select('id, name, phone, tags, vehicles(count)')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: false })

  const customers = (data ?? []) as CustomerRow[]

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="flex items-end justify-between">
        <div className="space-y-1">
          <p
            className="text-eyebrow"
            style={{ color: 'var(--ink-tertiary)' }}
          >
            Customers
          </p>
          <h1
            className="text-headline"
            style={{ color: 'var(--ink)' }}
          >
            お客さん一覧
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--ink-subtle)' }}
          >
            {customers.length} 名のお客様が登録されています
          </p>
        </div>
        <Link
          href="/customers/new"
          className="rounded-md px-4 py-2 text-sm font-semibold"
          style={{
            background: 'var(--theme-primary)',
            color: 'var(--theme-primary-fg)',
          }}
        >
          ＋ お客さんを追加
        </Link>
      </header>

      {customers.length > 0 ? (
        <div
          className="mt-8 overflow-hidden rounded-xl border"
          style={{
            background: 'var(--surface-1)',
            borderColor: 'var(--hairline)',
          }}
        >
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <Th>お名前</Th>
                <Th>タグ</Th>
                <Th>電話</Th>
                <Th>登録車両</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr
                  key={c.id}
                  className="transition-colors"
                  style={{
                    borderTop:
                      i === 0
                        ? '0'
                        : `1px solid var(--hairline)`,
                  }}
                >
                  <td
                    className="px-4 py-3.5 font-medium"
                    style={{ color: 'var(--ink)' }}
                  >
                    {c.name}
                  </td>
                  <td className="px-4 py-3.5">
                    <CustomerTagBadges tags={c.tags ?? []} />
                  </td>
                  <td
                    className="px-4 py-3.5 tabular-figs"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {c.phone || '—'}
                  </td>
                  <td
                    className="px-4 py-3.5 tabular-figs"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {c.vehicles?.[0]?.count ?? 0} 台
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-sm font-medium underline"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      詳細 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="mt-8 rounded-xl border border-dashed p-12 text-center"
          style={{ borderColor: 'var(--hairline)' }}
        >
          <p style={{ color: 'var(--ink-subtle)' }}>
            まだお客さんが登録されていません。
          </p>
          <Link
            href="/customers/new"
            className="mt-3 inline-block text-sm font-medium underline"
            style={{ color: 'var(--theme-accent)' }}
          >
            最初のお客さんを追加 →
          </Link>
        </div>
      )}
    </main>
  )
}

function Th({
  children,
  align = 'left',
}: {
  children?: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={`text-eyebrow px-4 py-3 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      style={{ color: 'var(--ink-tertiary)' }}
    >
      {children}
    </th>
  )
}
