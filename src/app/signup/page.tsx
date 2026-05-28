import { createAdminClient } from '@/lib/supabase/admin'
import { SignupForm } from './form'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>
}) {
  const { invite } = await searchParams

  let invitation: {
    shop_name: string
    role: 'owner' | 'staff'
  } | null = null

  if (invite) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('shop_invitations')
      .select('shop_id, role, expires_at, used_at, shops(name)')
      .eq('invitation_code', invite)
      .maybeSingle<{
        shop_id: string
        role: 'owner' | 'staff'
        expires_at: string
        used_at: string | null
        shops: { name: string } | null
      }>()

    if (
      data &&
      !data.used_at &&
      new Date(data.expires_at) > new Date() &&
      data.shops
    ) {
      invitation = {
        shop_name: data.shops.name,
        role: data.role,
      }
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            くるまカルテ
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {invitation
              ? `${invitation.shop_name} に${invitation.role === 'owner' ? 'オーナー' : 'スタッフ'}として参加`
              : '店舗の新規登録'}
          </p>
        </div>

        <SignupForm
          inviteCode={invite ?? null}
          shopName={invitation?.shop_name ?? null}
        />
      </div>
    </div>
  )
}
