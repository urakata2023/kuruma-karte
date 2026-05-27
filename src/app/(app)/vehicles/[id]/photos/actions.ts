'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { processImageServerSide } from '@/lib/image-server'
import { revalidatePath } from 'next/cache'

export type PhotoFormState = { error?: string } | undefined

export async function addVehiclePhoto(
  vehicleId: string,
  _prev: PhotoFormState,
  formData: FormData
): Promise<PhotoFormState> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('shop_id', shop.id)
    .single()
  if (!vehicle) return { error: '車両が見つかりません' }

  const file = formData.get('photo')
  if (!(file instanceof File) || file.size === 0) {
    return { error: '写真を選択してください' }
  }
  if (file.size > 20 * 1024 * 1024) {
    return { error: '画像サイズは20MB以下にしてください' }
  }

  const caption = ((formData.get('caption') as string) ?? '').trim() || null

  try {
    const { buffer, ext, contentType } = await processImageServerSide(file)
    const path = `${shop.id}/${vehicleId}/gallery-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('vehicle-photos')
      .upload(path, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType,
      })
    if (uploadError) return { error: uploadError.message }

    const {
      data: { publicUrl },
    } = supabase.storage.from('vehicle-photos').getPublicUrl(path)

    // sort_order: 既存の最大値 + 1
    const { data: maxR } = await supabase
      .from('vehicle_photos')
      .select('sort_order')
      .eq('vehicle_id', vehicleId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const sort_order = (maxR?.sort_order ?? 0) + 1

    const { error } = await supabase.from('vehicle_photos').insert({
      vehicle_id: vehicleId,
      shop_id: shop.id,
      photo_url: publicUrl,
      caption,
      sort_order,
    })
    if (error) return { error: error.message }

    revalidatePath(`/vehicles/${vehicleId}`)
    return undefined
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: `写真の処理に失敗: ${msg}` }
  }
}

export async function deleteVehiclePhoto(
  photoId: string,
  vehicleId: string
): Promise<void> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  const { error } = await supabase
    .from('vehicle_photos')
    .delete()
    .eq('id', photoId)
    .eq('shop_id', shop.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/vehicles/${vehicleId}`)
}
