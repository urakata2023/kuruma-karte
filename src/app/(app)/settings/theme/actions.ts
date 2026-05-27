'use server'

import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidTheme } from '@/lib/themes'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * 店舗テーマを更新する Server Action (Phase 10)
 */
export async function updateShopTheme(_prev: unknown, formData: FormData) {
  const themeId = formData.get('theme')

  if (!isValidTheme(themeId)) {
    return { error: '不正なテーマIDです' }
  }

  const { shop } = await getCurrentShop()
  const admin = createAdminClient()
  const { error } = await admin
    .from('shops')
    .update({ theme: themeId })
    .eq('id', shop.id)

  if (error) {
    console.error('updateShopTheme failed:', error)
    return { error: 'テーマの更新に失敗しました' }
  }

  revalidatePath('/', 'layout')
  redirect('/settings/theme?saved=1')
}
