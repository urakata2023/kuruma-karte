import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { OwnerMaintenanceForm } from '@/components/owner-maintenance-form'
import { updateOwnerMaintenanceRecord } from '../../actions'
import type { MaintenanceRecord } from '@/lib/types'

export default async function EditOwnerMaintenancePage({
  params,
}: {
  params: Promise<{ token: string; recordId: string }>
}) {
  const { token, recordId } = await params
  const admin = createAdminClient()

  const { data: vehicle } = await admin
    .from('vehicles')
    .select('id, model')
    .eq('view_token', token)
    .maybeSingle()
  if (!vehicle) notFound()

  const { data: record } = await admin
    .from('maintenance_records')
    .select('*')
    .eq('id', recordId)
    .eq('vehicle_id', (vehicle as { id: string }).id)
    .maybeSingle<MaintenanceRecord>()
  if (!record) notFound()

  // お店からの記録は編集不可
  if (record.created_by !== 'customer') notFound()

  const action = updateOwnerMaintenanceRecord.bind(null, token, record.id)

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <div className="mb-6">
        <Link
          href={`/my/${token}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← マイページへ
        </Link>
        <h1 className="mt-2 text-xl font-semibold">メモを編集</h1>
      </div>
      <OwnerMaintenanceForm
        action={action}
        record={record}
        submitLabel="保存する"
      />
    </main>
  )
}
