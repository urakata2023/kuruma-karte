import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export default async function RegistrationDonePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ name?: string }>
}) {
  const { token } = await params
  const { name } = await searchParams
  const admin = createAdminClient()
  const { data: shop } = await admin
    .from('shops')
    .select('name')
    .eq('registration_token', token)
    .maybeSingle()

  if (!shop) notFound()

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600 dark:bg-green-950 dark:text-green-400">
          ✓
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            登録ありがとうございます
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            {name ? `${name} 様、` : ''}
            {shop.name}への愛車登録が完了しました。
            <br />
            車検時期が近づきましたら、ご登録のメールアドレスにお知らせいたします。
          </p>
        </div>
        <p className="text-xs text-zinc-400">
          このページは閉じていただいて大丈夫です
        </p>
      </div>
    </div>
  )
}
