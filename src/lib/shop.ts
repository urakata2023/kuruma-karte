import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import type { Shop } from './types'

/**
 * 現在ログイン中のユーザーが所有する shop を取得。
 * 未認証 or shopなしなら /login にリダイレクト。
 *
 * (app) 配下のページ・Server Actionで必ず先頭で呼ぶ。
 */
export async function getCurrentShop(): Promise<{
  userId: string
  shop: Shop
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: shop, error } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_user_id', user.id)
    .single()

  if (error || !shop) redirect('/login')
  return { userId: user.id, shop: shop as Shop }
}
