import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import type { Shop } from './types'

export type ShopRole = 'owner' | 'staff'

/**
 * 現在ログイン中のユーザーが所属する shop を取得 (Phase F)。
 * 未認証 or 所属なしなら /login にリダイレクト。
 *
 * 旧実装: shops.owner_user_id でフィルタ (1ユーザー1店舗のみ)
 * 新実装: shop_members を経由 (1ユーザーが複数店舗の可能性、ロール付き)
 *
 * (app) 配下のページ・Server Actionで必ず先頭で呼ぶ。
 *
 * 注: ロックダウン期間中もマイグレ実行前は shop_members テーブルが
 *     存在しないので、フォールバックで shops.owner_user_id も併用。
 */
export async function getCurrentShop(): Promise<{
  userId: string
  shop: Shop
  role: ShopRole
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. shop_members 経由で所属シop取得 (Phase F 以降)
  type MemberRow = {
    role: ShopRole
    shops: Shop | null
  }
  const { data: memberRow } = await supabase
    .from('shop_members')
    .select('role, shops(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<MemberRow>()

  if (memberRow?.shops) {
    return { userId: user.id, shop: memberRow.shops, role: memberRow.role }
  }

  // 2. フォールバック: 旧 owner_user_id 経由 (マイグレ前データ・万一の保険)
  const { data: legacyShop } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_user_id', user.id)
    .maybeSingle<Shop>()

  if (legacyShop) {
    return { userId: user.id, shop: legacyShop, role: 'owner' }
  }

  redirect('/login')
}
