'use server'

import { createClient } from '@/lib/supabase/server'
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
 * メール＋パスワード＋店名で新規登録
 * 同時に shops テーブルに店舗レコードを作る
 */
export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const shopName = formData.get('shop_name') as string

  if (!shopName?.trim()) return { error: '店名を入力してください' }
  if (password.length < 8) return { error: 'パスワードは8文字以上で' }

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  if (!data.user) return { error: '登録に失敗しました（ユーザー作成失敗）' }

  // shops レコード作成
  const { error: shopError } = await supabase.from('shops').insert({
    owner_user_id: data.user.id,
    name: shopName.trim(),
  })
  if (shopError) {
    return { error: `店舗の作成に失敗しました: ${shopError.message}` }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
