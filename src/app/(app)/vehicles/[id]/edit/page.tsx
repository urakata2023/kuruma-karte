import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { VehicleForm } from '@/components/vehicle-form'
import { updateVehicle } from '../../actions'
import type { Vehicle, Customer } from '@/lib/types'

export default async function EditVehiclePage({
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

  const { data: customer } = await supabase
    .from('customers')
    .select('id, name')
    .eq('id', vehicle.customer_id)
    .single<Pick<Customer, 'id' | 'name'>>()

  const action = updateVehicle.bind(null, vehicle.id, vehicle.customer_id)

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <div className="mb-6">
        <Link
          href={`/customers/${vehicle.customer_id}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← {customer?.name ?? 'お客さん'} 様の詳細へ
        </Link>
        <h1 className="mt-2 text-xl font-semibold">車を編集</h1>
      </div>
      <VehicleForm action={action} vehicle={vehicle} />
    </main>
  )
}
