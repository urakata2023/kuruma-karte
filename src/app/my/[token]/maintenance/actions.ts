'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

type State = { error?: string } | undefined

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
 * view_token から車両を解決。
 * tokenが無効なら null を返す（呼び出し元でエラー処理）
 */
async function resolveVehicleByToken(token: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('vehicles')
    .select('id, shop_id')
    .eq('view_token', token)
    .maybeSingle()
  return data
}

/**
 * 添付画像をStorageへアップロード
 */
async function uploadAttachmentIfPresent(
  formData: FormData,
  vehicleId: string
): Promise<string | null> {
  const file = formData.get('attachment')
  if (!(file instanceof File) || file.size === 0) return null
  if (file.size > 10 * 1024 * 1024) return null // 10MB上限超過は無視

  const admin = createAdminClient()
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const path = `${vehicleId}/${Date.now()}.${ext}`

  const { error } = await admin.storage
    .from('maintenance-attachments')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || `image/${ext}`,
    })
  if (error) return null

  const {
    data: { publicUrl },
  } = admin.storage.from('maintenance-attachments').getPublicUrl(path)
  return publicUrl
}

export async function createOwnerMaintenanceRecord(
  token: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const vehicle = await resolveVehicleByToken(token)
  if (!vehicle) return { error: 'リンクが無効です' }

  const title = parseString(formData, 'title')
  if (!title) return { error: 'タイトルを入力してください' }
  const performed_on = parseString(formData, 'performed_on')
  if (!performed_on) return { error: '日付を入力してください' }

  const attachment_url = await uploadAttachmentIfPresent(formData, vehicle.id)

  const admin = createAdminClient()
  const { error } = await admin.from('maintenance_records').insert({
    vehicle_id: vehicle.id,
    shop_id: vehicle.shop_id,
    title,
    performed_on,
    mileage_km: parseInt0(formData, 'mileage_km'),
    description: parseString(formData, 'description'),
    cost: parseInt0(formData, 'cost'),
    created_by: 'customer',
    attachment_url,
  })
  if (error) return { error: error.message }

  redirect(`/my/${token}`)
}

export async function updateOwnerMaintenanceRecord(
  token: string,
  recordId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const vehicle = await resolveVehicleByToken(token)
  if (!vehicle) return { error: 'リンクが無効です' }

  const admin = createAdminClient()

  // この車両のお客様自身の記録だけ編集可能
  const { data: record } = await admin
    .from('maintenance_records')
    .select('id, created_by, attachment_url')
    .eq('id', recordId)
    .eq('vehicle_id', vehicle.id)
    .maybeSingle()
  if (!record) return { error: '記録が見つかりません' }
  if (record.created_by !== 'customer') {
    return { error: 'お店からの記録はお客様側から編集できません' }
  }

  const title = parseString(formData, 'title')
  if (!title) return { error: 'タイトルを入力してください' }
  const performed_on = parseString(formData, 'performed_on')
  if (!performed_on) return { error: '日付を入力してください' }

  const new_attachment = await uploadAttachmentIfPresent(formData, vehicle.id)
  const attachment_url = new_attachment ?? record.attachment_url

  const { error } = await admin
    .from('maintenance_records')
    .update({
      title,
      performed_on,
      mileage_km: parseInt0(formData, 'mileage_km'),
      description: parseString(formData, 'description'),
      cost: parseInt0(formData, 'cost'),
      attachment_url,
    })
    .eq('id', recordId)
  if (error) return { error: error.message }

  redirect(`/my/${token}`)
}

export async function deleteOwnerMaintenanceRecord(
  token: string,
  recordId: string
): Promise<void> {
  const vehicle = await resolveVehicleByToken(token)
  if (!vehicle) throw new Error('リンクが無効です')

  const admin = createAdminClient()

  const { data: record } = await admin
    .from('maintenance_records')
    .select('id, created_by')
    .eq('id', recordId)
    .eq('vehicle_id', vehicle.id)
    .maybeSingle()
  if (!record) throw new Error('記録が見つかりません')
  if (record.created_by !== 'customer') {
    throw new Error('お店からの記録は削除できません')
  }

  const { error } = await admin
    .from('maintenance_records')
    .delete()
    .eq('id', recordId)
  if (error) throw new Error(error.message)

  redirect(`/my/${token}`)
}
