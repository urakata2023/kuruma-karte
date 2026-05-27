import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MaintenanceForm } from '@/components/maintenance-form'
import { updateMaintenanceRecord } from '../../actions'
import type { Vehicle, MaintenanceRecord } from '@/lib/types'

export default async function EditMaintenancePage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>
}) {
  const { id, recordId } = await params
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  const [vehicleR, recordR] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, model, plate_number')
      .eq('id', id)
      .eq('shop_id', shop.id)
      .single<Pick<Vehicle, 'id' | 'model' | 'plate_number'>>(),
    supabase
      .from('maintenance_records')
      .select('*')
      .eq('id', recordId)
      .eq('shop_id', shop.id)
      .single<MaintenanceRecord>(),
  ])

  if (!vehicleR.data || !recordR.data) notFound()

  const vehicle = vehicleR.data
  const record = recordR.data
  const action = updateMaintenanceRecord.bind(null, record.id, vehicle.id)

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <div className="mb-6">
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← {vehicle.model ?? 'お車'}の詳細へ
        </Link>
        <h1 className="mt-2 text-xl font-semibold">整備記録を編集</h1>
      </div>
      <MaintenanceForm action={action} record={record} submitLabel="保存する" />
    </main>
  )
}
