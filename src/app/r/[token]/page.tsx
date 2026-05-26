import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { PublicRegistrationForm } from './form'
import { registerCustomerVehicle } from './actions'

export default async function PublicRegistrationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()
  const { data: shop } = await admin
    .from('shops')
    .select('id, name')
    .eq('registration_token', token)
    .maybeSingle()

  if (!shop) notFound()

  const action = registerCustomerVehicle.bind(null, token)

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <p className="text-sm text-zinc-500">{shop.name} お客様登録</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            愛車を登録する
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            車検時期のご案内などを{shop.name}からお送りいたします。
            <br />
            ご入力は1分ほどで完了します。
          </p>
        </div>

        <PublicRegistrationForm action={action} shopName={shop.name} />

        <p className="text-center text-xs text-zinc-400">
          このページは くるまカルテ から提供されています
        </p>
      </div>
    </div>
  )
}
