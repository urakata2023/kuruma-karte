'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentShop } from '@/lib/shop'
import { processImageServerSide } from '@/lib/image-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type MaintenanceFormState = { error?: string } | undefined

function parseString(formData: FormData, key: string): string | null {
  const v = ((formData.get(key) as string) ?? '').trim()
  return v || null
}

function parseInt0(formData: FormData, key: string): number | null {
  const v = ((formData.get(key) as string) ?? '').trim()
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : null
}

/**
 * 整備記録の写真をアップロードして URL を返す (Phase A)
 * - field: 'before_photo' or 'after_photo'
 * - vehicle-photos バケットの maintenance/{vehicle_id}/{before|after}-{timestamp}.jpg として保存
 */
async function uploadMaintenancePhoto(
  formData: FormData,
  field: string,
  vehicleId: string,
  kind: 'before' | 'after'
): Promise<string | null> {
  const file = formData.get(field)
  if (!(file instanceof File) || file.size === 0) return null

  const { buffer } = await processImageServerSide(file)
  const admin = createAdminClient()
  const filename = `${kind}-${Date.now()}.jpg`
  const path = `maintenance/${vehicleId}/${filename}`

  const { error } = await admin.storage
    .from('vehicle-photos')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: false })
  if (error) {
    console.error(`${kind} photo upload failed:`, error)
    throw new Error(`${kind === 'before' ? '整備前' : '整備後'}の写真アップロードに失敗`)
  }

  const { data } = admin.storage.from('vehicle-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function createMaintenanceRecord(
  vehicleId: string,
  _prev: MaintenanceFormState,
  formData: FormData
): Promise<MaintenanceFormState> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  // 車両がこの shop のものか確認
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('shop_id', shop.id)
    .single()
  if (!vehicle) return { error: '車両が見つかりません' }

  const title = parseString(formData, 'title')
  if (!title) return { error: '整備のタイトルを入力してください' }
  const performed_on = parseString(formData, 'performed_on')
  if (!performed_on) return { error: '整備日を入力してください' }

  let beforeUrl: string | null = null
  let afterUrl: string | null = null
  try {
    beforeUrl = await uploadMaintenancePhoto(
      formData,
      'before_photo',
      vehicleId,
      'before'
    )
    afterUrl = await uploadMaintenancePhoto(
      formData,
      'after_photo',
      vehicleId,
      'after'
    )
  } catch (e) {
    return { error: e instanceof Error ? e.message : '写真アップロード失敗' }
  }

  const { error } = await supabase.from('maintenance_records').insert({
    vehicle_id: vehicleId,
    shop_id: shop.id,
    title,
    performed_on,
    mileage_km: parseInt0(formData, 'mileage_km'),
    description: parseString(formData, 'description'),
    parts: parseString(formData, 'parts'),
    cost: parseInt0(formData, 'cost'),
    before_photo_url: beforeUrl,
    after_photo_url: afterUrl,
  })
  if (error) return { error: error.message }

  revalidatePath(`/vehicles/${vehicleId}`)
  revalidatePath('/dashboard')
  redirect(`/vehicles/${vehicleId}`)
}

export async function updateMaintenanceRecord(
  recordId: string,
  vehicleId: string,
  _prev: MaintenanceFormState,
  formData: FormData
): Promise<MaintenanceFormState> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  const title = parseString(formData, 'title')
  if (!title) return { error: '整備のタイトルを入力してください' }
  const performed_on = parseString(formData, 'performed_on')
  if (!performed_on) return { error: '整備日を入力してください' }

  // 写真追加 (既存写真はそのまま)
  let beforeUrl: string | undefined = undefined
  let afterUrl: string | undefined = undefined
  try {
    const b = await uploadMaintenancePhoto(
      formData,
      'before_photo',
      vehicleId,
      'before'
    )
    if (b) beforeUrl = b
    const a = await uploadMaintenancePhoto(
      formData,
      'after_photo',
      vehicleId,
      'after'
    )
    if (a) afterUrl = a
  } catch (e) {
    return { error: e instanceof Error ? e.message : '写真アップロード失敗' }
  }

  const updates: Record<string, unknown> = {
    title,
    performed_on,
    mileage_km: parseInt0(formData, 'mileage_km'),
    description: parseString(formData, 'description'),
    parts: parseString(formData, 'parts'),
    cost: parseInt0(formData, 'cost'),
  }
  if (beforeUrl !== undefined) updates.before_photo_url = beforeUrl
  if (afterUrl !== undefined) updates.after_photo_url = afterUrl

  const { error } = await supabase
    .from('maintenance_records')
    .update(updates)
    .eq('id', recordId)
    .eq('shop_id', shop.id)
  if (error) return { error: error.message }

  revalidatePath(`/vehicles/${vehicleId}`)
  redirect(`/vehicles/${vehicleId}`)
}

export async function deleteMaintenanceRecord(
  recordId: string,
  vehicleId: string
): Promise<void> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()
  const { error } = await supabase
    .from('maintenance_records')
    .delete()
    .eq('id', recordId)
    .eq('shop_id', shop.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/vehicles/${vehicleId}`)
  redirect(`/vehicles/${vehicleId}`)
}
