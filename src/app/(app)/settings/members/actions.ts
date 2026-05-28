'use server'

import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

/**
 * 招待コードを発行する (Phase F)
 * 7日間有効のランダムトークンを生成。
 * 招待URL: /signup?invite=<code>
 */
export async function createInvitation(_prev: unknown, formData: FormData) {
  const { shop, userId, role } = await getCurrentShop()
  if (role !== 'owner') return { error: 'オーナー権限が必要です' }

  const inviteRole = ((formData.get('role') as string) || 'staff') as
    | 'staff'
    | 'owner'
  if (!['staff', 'owner'].includes(inviteRole)) {
    return { error: '不正なロールです' }
  }

  const code = randomBytes(16).toString('base64url')
  const admin = createAdminClient()
  const { error } = await admin.from('shop_invitations').insert({
    shop_id: shop.id,
    invitation_code: code,
    role: inviteRole,
    created_by: userId,
  })
  if (error) return { error: error.message }

  revalidatePath('/settings/members')
  return { ok: true, code }
}

/**
 * 招待を無効化（削除）する。
 */
export async function revokeInvitation(invitationId: string): Promise<void> {
  const { shop, role } = await getCurrentShop()
  if (role !== 'owner') throw new Error('オーナー権限が必要です')

  const admin = createAdminClient()
  await admin
    .from('shop_invitations')
    .delete()
    .eq('id', invitationId)
    .eq('shop_id', shop.id)

  revalidatePath('/settings/members')
}

/**
 * メンバーを削除する。owner本人は削除できない。
 */
export async function removeMember(memberId: string): Promise<void> {
  const { shop, userId, role } = await getCurrentShop()
  if (role !== 'owner') throw new Error('オーナー権限が必要です')

  const admin = createAdminClient()
  // 自分自身は削除不可
  const { data: target } = await admin
    .from('shop_members')
    .select('user_id, role')
    .eq('id', memberId)
    .eq('shop_id', shop.id)
    .maybeSingle<{ user_id: string; role: string }>()

  if (!target) return
  if (target.user_id === userId) {
    throw new Error('自分自身は削除できません')
  }

  await admin
    .from('shop_members')
    .delete()
    .eq('id', memberId)
    .eq('shop_id', shop.id)

  revalidatePath('/settings/members')
}
