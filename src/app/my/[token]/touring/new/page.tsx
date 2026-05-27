import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TouringForm } from '@/components/touring-form'
import { createTouringRecord } from '../actions'

export default async function NewTouringPage({
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

  const action = createTouringRecord.bind(null, token)

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <div className="mb-6">
        <Link
          href={`/my/${token}`}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← マイページへ
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          🛣️ ツーリングを記録する
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {(vehicle as { model: string | null }).model ?? '愛車'} と一緒に行った場所の思い出を残します
        </p>
      </div>
      <TouringForm action={action} />
    </main>
  )
}
