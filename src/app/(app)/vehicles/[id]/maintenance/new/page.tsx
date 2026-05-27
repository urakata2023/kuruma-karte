import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MaintenanceForm } from '@/components/maintenance-form'
import { createMaintenanceRecord } from '../actions'
import type { Vehicle } from '@/lib/types'

export default async function NewMaintenancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, model, plate_number')
    .eq('id', id)
    .eq('shop_id', shop.id)
    .single<Pick<Vehicle, 'id' | 'model' | 'plate_number'>>()

  if (!vehicle) notFound()

  const action = createMaintenanceRecord.bind(null, vehicle.id)

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <div className="mb-6">
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← {vehicle.model ?? 'お車'}の詳細へ
        </Link>
        <h1 className="mt-2 text-xl font-semibold">整備を記録する</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {vehicle.model ?? '車両'}
          {vehicle.plate_number && ` / ${vehicle.plate_number}`}
        </p>
      </div>
      <MaintenanceForm action={action} submitLabel="記録する" />
    </main>
  )
}
