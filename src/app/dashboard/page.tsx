import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '../auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_user_id', user.id)
    .single()

  return (
    <div className="flex flex-1 flex-col px-6 py-10">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">くるまカルテ</h1>
          <p className="text-sm text-zinc-500">
            {shop?.name ?? user.email}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            ログアウト
          </button>
        </form>
      </header>

      <main className="mx-auto mt-10 w-full max-w-5xl space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="お客さん" value="0人" />
          <Stat label="登録車両" value="0台" />
          <Stat label="今月車検" value="0台" />
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold">
            ◆ 今月、車検が来るお客さん
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            まだ登録がありません。お客さんと車を登録すると、ここに自動で並びます。
          </p>
        </section>

        <section className="rounded-lg border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
          <strong className="font-medium text-zinc-700">Phase 0 メモ：</strong>{' '}
          顧客・車のCRUD、自動通知、Stripe課金、QR車登録、オーナーマイページは
          次フェーズで実装します。今はログイン・店舗登録までが動く状態です。
        </section>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}
