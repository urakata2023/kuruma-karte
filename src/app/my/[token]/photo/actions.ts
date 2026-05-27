'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { processImageServerSide } from '@/lib/image-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type State = { error?: string } | undefined

/**
 * お客様マイページから車両の写真を更新する Server Action。
 * view_token で車両を特定 → service_role で vehicles.photo_url を更新。
 */
export async function updateVehiclePhotoByToken(
  token: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const admin = createAdminClient()
  const { data: vehicle } = await admin
    .from('vehicles')
    .select('id, shop_id')
    .eq('view_token', token)
    .maybeSingle()
  if (!vehicle) return { error: 'リンクが無効です' }

  const file = formData.get('photo')
  if (!(file instanceof File) || file.size === 0) {
    return { error: '写真を選択してください' }
  }
  if (file.size > 20 * 1024 * 1024) {
    return { error: '画像サイズは20MB以下にしてください' }
  }

  try {
    const { buffer, ext, contentType } = await processImageServerSide(file)
    const path = `${vehicle.shop_id}/${vehicle.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await admin.storage
      .from('vehicle-photos')
      .upload(path, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType,
      })
    if (uploadError) return { error: uploadError.message }

    const {
      data: { publicUrl },
    } = admin.storage.from('vehicle-photos').getPublicUrl(path)

    await admin
      .from('vehicles')
      .update({ photo_url: publicUrl })
      .eq('id', vehicle.id)

    revalidatePath(`/my/${token}`)
    redirect(`/my/${token}`)
  } catch (e) {
    // redirectは特殊なthrow（NEXT_REDIRECT）なので、redirect由来かを判定して再throw
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    const msg = e instanceof Error ? e.message : String(e)
    return { error: `写真の処理に失敗: ${msg}` }
  }
}
