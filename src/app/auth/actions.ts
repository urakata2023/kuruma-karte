'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export type AuthFormState = { error?: string } | undefined

/**
 * メール＋パスワードでログイン
 */
export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  redirect('/dashboard')
}

/**
 * メール＋パスワード＋店名で新規登録 (新規オーナー)
 * または invite コードでスタッフ登録
 *
 * - invite なし → 新規 shops + owner として shop_members に登録
 * - invite あり → 招待元 shop に staff/owner として参加 (shop は作らない)
 */
export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const shopName = (formData.get('shop_name') as string) ?? ''
  const inviteCode = ((formData.get('invite_code') as string) ?? '').trim()

  if (password.length < 8) return { error: 'パスワードは8文字以上で' }

  // 招待コード経由の場合 (Phase F)
  if (inviteCode) {
    const admin = createAdminClient()
    const { data: invitation } = await admin
      .from('shop_invitations')
      .select('id, shop_id, role, expires_at, used_at')
      .eq('invitation_code', inviteCode)
      .maybeSingle<{
        id: string
        shop_id: string
        role: 'owner' | 'staff'
        expires_at: string
        used_at: string | null
      }>()

    if (!invitation) return { error: '招待コードが見つかりません' }
    if (invitation.used_at) return { error: 'この招待は既に使用済みです' }
    if (new Date(invitation.expires_at) < new Date())
      return { error: 'この招待は有効期限切れです' }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (!data.user) return { error: '登録に失敗しました' }

    // shop_members に追加 + 招待を used_at で塞ぐ
    const { error: memErr } = await admin.from('shop_members').insert({
      shop_id: invitation.shop_id,
      user_id: data.user.id,
      role: invitation.role,
    })
    if (memErr)
      return { error: `メンバー登録失敗: ${memErr.message}` }

    await admin
      .from('shop_invitations')
      .update({ used_by: data.user.id, used_at: new Date().toISOString() })
      .eq('id', invitation.id)

    redirect('/dashboard')
  }

  // 通常の新規オーナー登録
  if (!shopName?.trim()) return { error: '店名を入力してください' }

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  if (!data.user) return { error: '登録に失敗しました（ユーザー作成失敗）' }

  // shops レコード作成 (admin client で RLS バイパス、まだメンバー登録前なので)
  const admin = createAdminClient()
  const { data: newShop, error: shopError } = await admin
    .from('shops')
    .insert({
      owner_user_id: data.user.id,
      name: shopName.trim(),
    })
    .select()
    .single<{ id: string }>()

  if (shopError || !newShop) {
    return { error: `店舗の作成に失敗しました: ${shopError?.message}` }
  }

  // shop_members に owner として登録 (Phase F)
  await admin.from('shop_members').insert({
    shop_id: newShop.id,
    user_id: data.user.id,
    role: 'owner',
  })

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
