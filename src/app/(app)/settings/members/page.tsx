import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import { InvitationPanel } from './invitation-panel'
import { MemberRow } from './member-row'

export const metadata = {
  title: 'スタッフ管理 — くるまカルテ',
}

type Member = {
  id: string
  user_id: string
  role: 'owner' | 'staff'
  display_name: string | null
  created_at: string
  email?: string | null
}

type Invitation = {
  id: string
  invitation_code: string
  role: 'owner' | 'staff'
  expires_at: string
  used_at: string | null
  created_at: string
}

export default async function MembersPage() {
  const { shop, role } = await getCurrentShop()

  if (role !== 'owner') {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">🔒 アクセス制限</h1>
        <p className="mt-3 text-sm text-zinc-500">
          スタッフ管理は店舗オーナーのみが操作できます。
        </p>
      </main>
    )
  }

  const admin = createAdminClient()
  const { data: membersData } = await admin
    .from('shop_members')
    .select('id, user_id, role, display_name, created_at')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: true })

  const members = (membersData ?? []) as Member[]

  // 各メンバーのメールアドレスを auth.users から取得
  for (const m of members) {
    try {
      const { data } = await admin.auth.admin.getUserById(m.user_id)
      m.email = data?.user?.email ?? null
    } catch {
      m.email = null
    }
  }

  const { data: invitations } = await admin
    .from('shop_invitations')
    .select('id, invitation_code, role, expires_at, used_at, created_at')
    .eq('shop_id', shop.id)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://kuruma-karte.vercel.app'

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10">
      <header className="space-y-1">
        <p
          className="text-eyebrow"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          Settings / Members
        </p>
        <h1
          className="text-headline"
          style={{ color: 'var(--ink)' }}
        >
          👥 スタッフ管理
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-subtle)' }}>
          整備士・事務員を招待して店舗を一緒に運営できます。
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-base font-semibold">
          メンバー（{members.length}名）
        </h2>
        <ul className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} />
          ))}
        </ul>
      </section>

      <InvitationPanel
        invitations={(invitations ?? []) as Invitation[]}
        appUrl={appUrl}
      />
    </main>
  )
}
