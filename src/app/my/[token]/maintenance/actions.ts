'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { processImageServerSide } from '@/lib/image-server'
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
 * 添付画像をサーバーで処理してStorageへアップロード。
 * クライアント変換失敗時の保険として server-side 変換が走る。
 */
async function uploadAttachmentIfPresent(
  formData: FormData,
  vehicleId: string
): Promise<{ url: string | null; error?: string }> {
  const file = formData.get('attachment')
  if (!(file instanceof File) || file.size === 0) return { url: null }
  if (file.size > 20 * 1024 * 1024) {
    return { url: null, error: '画像サイズは20MB以下にしてください' }
  }

  try {
    const { buffer, ext, contentType } = await processImageServerSide(file)
    const admin = createAdminClient()
    const path = `${vehicleId}/${Date.now()}.${ext}`
    const { error } = await admin.storage
      .from('maintenance-attachments')
      .upload(path, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType,
      })
    if (error) return { url: null, error: error.message }

    const {
      data: { publicUrl },
    } = admin.storage.from('maintenance-attachments').getPublicUrl(path)
    return { url: publicUrl }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { url: null, error: `写真の処理に失敗: ${msg}` }
  }
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

  const { url: attachment_url, error: uploadError } =
    await uploadAttachmentIfPresent(formData, vehicle.id)
  if (uploadError) return { error: uploadError }

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

  const { url: new_attachment, error: uploadError } =
    await uploadAttachmentIfPresent(formData, vehicle.id)
  if (uploadError) return { error: uploadError }
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
