import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { OwnerMaintenanceForm } from '@/components/owner-maintenance-form'
import { createOwnerMaintenanceRecord } from '../actions'

export default async function NewOwnerMaintenancePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()
  const { data: vehicle } = await admin
    .from('vehicles')
    .select('id, model')
    .eq('view_token', token)
    .maybeSingle()

  if (!vehicle) notFound()

  const action = createOwnerMaintenanceRecord.bind(null, token)

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <div className="mb-6">
        <Link
          href={`/my/${token}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← マイページへ
        </Link>
        <h1 className="mt-2 text-xl font-semibold">自分でメモを追加</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {(vehicle as { model: string | null }).model ?? 'お車'} の記録を追加します
        </p>
      </div>
      <OwnerMaintenanceForm action={action} />
    </main>
  )
}
