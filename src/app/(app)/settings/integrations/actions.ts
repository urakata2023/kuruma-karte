'use server'

import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateIntegrations(
  _prev: unknown,
  formData: FormData
) {
  const { shop } = await getCurrentShop()
  const admin = createAdminClient()

  const updates: Record<string, string | null> = {
    line_channel_access_token:
      ((formData.get('line_channel_access_token') as string) || '').trim() ||
      null,
    line_owner_user_id:
      ((formData.get('line_owner_user_id') as string) || '').trim() || null,
    liny_api_key:
      ((formData.get('liny_api_key') as string) || '').trim() || null,
    liny_workspace_id:
      ((formData.get('liny_workspace_id') as string) || '').trim() || null,
  }

  const { error } = await admin
    .from('shops')
    .update(updates)
    .eq('id', shop.id)

  if (error) {
    console.error('integrations update failed:', error)
    return { error: '保存に失敗しました' }
  }

  revalidatePath('/settings/integrations')
  redirect('/settings/integrations?saved=1')
}
