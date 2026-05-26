import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { VehicleForm } from '@/components/vehicle-form'
import { createVehicle } from '../../../../vehicles/actions'
import type { Customer } from '@/lib/types'

export default async function NewVehiclePage({
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

  const action = createVehicle.bind(null, customer.id)

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <div className="mb-6">
        <Link
          href={`/customers/${customer.id}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← {customer.name} 様の詳細へ
        </Link>
        <h1 className="mt-2 text-xl font-semibold">車を追加</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {customer.name} 様の車両を登録します。
        </p>
      </div>
      <VehicleForm action={action} submitLabel="登録する" />
    </main>
  )
}
