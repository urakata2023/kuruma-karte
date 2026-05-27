'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type VehicleFormState = { error?: string } | undefined

function parseField(formData: FormData, key: string): string | null {
  const v = ((formData.get(key) as string) ?? '').trim()
  return v || null
}

/**
 * 写真をSupabase Storageへアップロードし、公開URLを返す。
 * 失敗時は null（既存photo_urlを維持する）。
 */
async function uploadPhotoIfPresent(
  formData: FormData,
  shopId: string,
  vehicleId: string
): Promise<{ photoUrl?: string | null; error?: string }> {
  const photo = formData.get('photo')
  if (!(photo instanceof File) || photo.size === 0) {
    return {} // 写真未指定、既存維持
  }

  // ファイルサイズ制限（10MB）
  if (photo.size > 10 * 1024 * 1024) {
    return { error: '画像サイズは10MB以下にしてください' }
  }

  const ext = (photo.name.split('.').pop() ?? 'jpg').toLowerCase()
  const path = `${shopId}/${vehicleId}/${Date.now()}.${ext}`

  const supabase = await createClient()
  const { error: uploadError } = await supabase.storage
    .from('vehicle-photos')
    .upload(path, photo, {
      cacheControl: '3600',
      upsert: true,
      contentType: photo.type || `image/${ext}`,
    })

  if (uploadError) {
    return { error: `写真のアップロードに失敗: ${uploadError.message}` }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('vehicle-photos').getPublicUrl(path)

  return { photoUrl: publicUrl }
}

export async function createVehicle(
  customerId: string,
  _prev: VehicleFormState,
  formData: FormData
): Promise<VehicleFormState> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('shop_id', shop.id)
    .single()
  if (!customer) return { error: '顧客が見つかりません' }

  // まず写真なしで作成し、IDが取れてから写真をアップロード
  const { data: newVehicle, error: insertError } = await supabase
    .from('vehicles')
    .insert({
      customer_id: customerId,
      shop_id: shop.id,
      model: parseField(formData, 'model'),
      plate_number: parseField(formData, 'plate_number'),
      first_registration_ym: parseField(formData, 'first_registration_ym'),
      inspection_expires_on: parseField(formData, 'inspection_expires_on'),
      purchased_on: parseField(formData, 'purchased_on'),
      last_oil_change_on: parseField(formData, 'last_oil_change_on'),
    })
    .select('id')
    .single()

  if (insertError || !newVehicle) {
    return { error: insertError?.message ?? '車両登録に失敗しました' }
  }

  // 写真があればアップロード
  const photoResult = await uploadPhotoIfPresent(
    formData,
    shop.id,
    newVehicle.id
  )
  if (photoResult.error) return { error: photoResult.error }
  if (photoResult.photoUrl) {
    await supabase
      .from('vehicles')
      .update({ photo_url: photoResult.photoUrl })
      .eq('id', newVehicle.id)
  }

  revalidatePath(`/customers/${customerId}`)
  revalidatePath('/dashboard')
  redirect(`/customers/${customerId}`)
}

export async function updateVehicle(
  id: string,
  customerId: string,
  _prev: VehicleFormState,
  formData: FormData
): Promise<VehicleFormState> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  // 写真があればアップロード
  const photoResult = await uploadPhotoIfPresent(formData, shop.id, id)
  if (photoResult.error) return { error: photoResult.error }

  const updateData: Record<string, string | null> = {
    model: parseField(formData, 'model'),
    plate_number: parseField(formData, 'plate_number'),
    first_registration_ym: parseField(formData, 'first_registration_ym'),
    inspection_expires_on: parseField(formData, 'inspection_expires_on'),
    purchased_on: parseField(formData, 'purchased_on'),
    last_oil_change_on: parseField(formData, 'last_oil_change_on'),
  }
  if (photoResult.photoUrl) {
    updateData.photo_url = photoResult.photoUrl
  }

  const { error } = await supabase
    .from('vehicles')
    .update(updateData)
    .eq('id', id)
    .eq('shop_id', shop.id)
  if (error) return { error: error.message }

  revalidatePath(`/customers/${customerId}`)
  revalidatePath('/dashboard')
  redirect(`/customers/${customerId}`)
}

export async function deleteVehicle(
  id: string,
  customerId: string
): Promise<void> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)
    .eq('shop_id', shop.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/customers/${customerId}`)
  revalidatePath('/dashboard')
  redirect(`/customers/${customerId}`)
}
