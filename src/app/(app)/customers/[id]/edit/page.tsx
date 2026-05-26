import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CustomerForm } from '@/components/customer-form'
import { updateCustomer } from '../../actions'
import type { Customer } from '@/lib/types'

export default async function EditCustomerPage({
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

  const action = updateCustomer.bind(null, customer.id)

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <div className="mb-6">
        <Link
          href={`/customers/${customer.id}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← {customer.name} 様の詳細へ
        </Link>
        <h1 className="mt-2 text-xl font-semibold">お客さんを編集</h1>
      </div>
      <CustomerForm action={action} customer={customer} />
    </main>
  )
}
