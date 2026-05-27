import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TouringForm } from '@/components/touring-form'
import { updateTouringRecord } from '../../actions'
import type { TouringRecord } from '@/lib/types'

export default async function EditTouringPage({
  params,
}: {
  params: Promise<{ token: string; recordId: string }>
}) {
  const { token, recordId } = await params
  const admin = createAdminClient()

  const { data: vehicle } = await admin
    .from('vehicles')
    .select('id')
    .eq('view_token', token)
    .maybeSingle()
  if (!vehicle) notFound()

  const { data: record } = await admin
    .from('touring_records')
    .select('*')
    .eq('id', recordId)
    .eq('vehicle_id', (vehicle as { id: string }).id)
    .maybeSingle<TouringRecord>()
  if (!record) notFound()
  if (record.created_by !== 'customer') notFound()

  const action = updateTouringRecord.bind(null, token, record.id)

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <div className="mb-6">
        <Link
          href={`/my/${token}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← マイページへ
        </Link>
        <h1 className="mt-2 text-xl font-semibold">ツーリング記録を編集</h1>
      </div>
      <TouringForm action={action} record={record} submitLabel="保存する" />
    </main>
  )
}
