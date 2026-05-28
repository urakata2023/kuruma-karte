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

/**
 * vehicle_photos に1枚追加 (ギャラリー用)
 */
export async function addGalleryPhoto(
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
    const path = `${vehicle.shop_id}/${vehicle.id}/gallery-${Date.now()}.${ext}`
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

    // 現在の最大 sort_order を取得して +1
    const { data: maxRow } = await admin
      .from('vehicle_photos')
      .select('sort_order')
      .eq('vehicle_id', vehicle.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle<{ sort_order: number }>()
    const nextOrder = (maxRow?.sort_order ?? -1) + 1

    await admin.from('vehicle_photos').insert({
      vehicle_id: vehicle.id,
      shop_id: vehicle.shop_id,
      photo_url: publicUrl,
      sort_order: nextOrder,
    })

    revalidatePath(`/my/${token}`)
    revalidatePath(`/my/${token}/photo`)
    redirect(`/my/${token}/photo`)
  } catch (e) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    const msg = e instanceof Error ? e.message : String(e)
    return { error: `写真の処理に失敗: ${msg}` }
  }
}

/**
 * ギャラリー写真を1枚削除
 */
export async function deleteGalleryPhoto(
  token: string,
  photoId: string
): Promise<void> {
  const admin = createAdminClient()
  const { data: vehicle } = await admin
    .from('vehicles')
    .select('id')
    .eq('view_token', token)
    .maybeSingle()
  if (!vehicle) throw new Error('リンクが無効です')

  await admin
    .from('vehicle_photos')
    .delete()
    .eq('id', photoId)
    .eq('vehicle_id', vehicle.id)

  revalidatePath(`/my/${token}`)
  revalidatePath(`/my/${token}/photo`)
}

/**
 * 写真の並び替え (↑/↓ ボタンで隣同士入れ替え)
 */
export async function reorderGalleryPhoto(
  token: string,
  photoId: string,
  direction: 'up' | 'down'
): Promise<void> {
  const admin = createAdminClient()
  const { data: vehicle } = await admin
    .from('vehicles')
    .select('id')
    .eq('view_token', token)
    .maybeSingle()
  if (!vehicle) return

  const { data: allPhotos } = await admin
    .from('vehicle_photos')
    .select('id, sort_order')
    .eq('vehicle_id', vehicle.id)
    .order('sort_order', { ascending: true })

  if (!allPhotos) return
  const idx = allPhotos.findIndex((p) => p.id === photoId)
  if (idx < 0) return

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= allPhotos.length) return

  const a = allPhotos[idx]
  const b = allPhotos[swapIdx]
  // sort_order を入れ替え
  await admin
    .from('vehicle_photos')
    .update({ sort_order: b.sort_order })
    .eq('id', a.id)
  await admin
    .from('vehicle_photos')
    .update({ sort_order: a.sort_order })
    .eq('id', b.id)

  revalidatePath(`/my/${token}`)
  revalidatePath(`/my/${token}/photo`)
}

/**
 * ギャラリー写真をヒーロー (vehicles.photo_url) に昇格
 */
export async function setAsHeroPhoto(
  token: string,
  photoUrl: string
): Promise<void> {
  const admin = createAdminClient()
  const { data: vehicle } = await admin
    .from('vehicles')
    .select('id')
    .eq('view_token', token)
    .maybeSingle()
  if (!vehicle) return

  await admin
    .from('vehicles')
    .update({ photo_url: photoUrl })
    .eq('id', vehicle.id)

  revalidatePath(`/my/${token}`)
  revalidatePath(`/my/${token}/photo`)
}
