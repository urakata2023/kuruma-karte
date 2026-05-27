'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { processImageServerSide } from '@/lib/image-server'
import { redirect } from 'next/navigation'

type State = { error?: string } | undefined

function parseString(formData: FormData, key: string): string | null {
  const v = ((formData.get(key) as string) ?? '').trim()
  return v || null
}

function parseFloat0(formData: FormData, key: string): number | null {
  const v = ((formData.get(key) as string) ?? '').trim()
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
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

async function uploadTouringPhoto(
  formData: FormData,
  vehicleId: string
): Promise<{ url: string | null; error?: string }> {
  const file = formData.get('photo')
  if (!(file instanceof File) || file.size === 0) return { url: null }
  if (file.size > 20 * 1024 * 1024) {
    return { url: null, error: '画像サイズは20MB以下にしてください' }
  }
  try {
    const { buffer, ext, contentType } = await processImageServerSide(file)
    const admin = createAdminClient()
    const path = `${vehicleId}/${Date.now()}.${ext}`
    const { error } = await admin.storage
      .from('touring-photos')
      .upload(path, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType,
      })
    if (error) return { url: null, error: error.message }
    const {
      data: { publicUrl },
    } = admin.storage.from('touring-photos').getPublicUrl(path)
    return { url: publicUrl }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { url: null, error: `写真の処理に失敗: ${msg}` }
  }
}

export async function createTouringRecord(
  token: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const vehicle = await resolveVehicleByToken(token)
  if (!vehicle) return { error: 'リンクが無効です' }

  const title = parseString(formData, 'title')
  if (!title) return { error: 'タイトルを入力してください' }
  const touring_date = parseString(formData, 'touring_date')
  if (!touring_date) return { error: '日付を入力してください' }

  const { url: photo_url, error: uploadError } = await uploadTouringPhoto(
    formData,
    vehicle.id
  )
  if (uploadError) return { error: uploadError }

  const admin = createAdminClient()
  const { error } = await admin.from('touring_records').insert({
    vehicle_id: vehicle.id,
    shop_id: vehicle.shop_id,
    touring_date,
    title,
    place_name: parseString(formData, 'place_name'),
    address: parseString(formData, 'address'),
    latitude: parseFloat0(formData, 'latitude'),
    longitude: parseFloat0(formData, 'longitude'),
    photo_url,
    memo: parseString(formData, 'memo'),
    created_by: 'customer',
  })
  if (error) return { error: error.message }

  redirect(`/my/${token}`)
}

export async function updateTouringRecord(
  token: string,
  recordId: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const vehicle = await resolveVehicleByToken(token)
  if (!vehicle) return { error: 'リンクが無効です' }

  const admin = createAdminClient()
  const { data: record } = await admin
    .from('touring_records')
    .select('id, created_by, photo_url')
    .eq('id', recordId)
    .eq('vehicle_id', vehicle.id)
    .maybeSingle()
  if (!record) return { error: '記録が見つかりません' }
  if (record.created_by !== 'customer') {
    return { error: 'お店の記録は編集できません' }
  }

  const title = parseString(formData, 'title')
  if (!title) return { error: 'タイトルを入力してください' }
  const touring_date = parseString(formData, 'touring_date')
  if (!touring_date) return { error: '日付を入力してください' }

  const { url: newPhoto, error: uploadError } = await uploadTouringPhoto(
    formData,
    vehicle.id
  )
  if (uploadError) return { error: uploadError }
  const photo_url = newPhoto ?? record.photo_url

  const { error } = await admin
    .from('touring_records')
    .update({
      title,
      touring_date,
      place_name: parseString(formData, 'place_name'),
      address: parseString(formData, 'address'),
      latitude: parseFloat0(formData, 'latitude'),
      longitude: parseFloat0(formData, 'longitude'),
      photo_url,
      memo: parseString(formData, 'memo'),
    })
    .eq('id', recordId)
  if (error) return { error: error.message }

  redirect(`/my/${token}`)
}

export async function deleteTouringRecord(
  token: string,
  recordId: string
): Promise<void> {
  const vehicle = await resolveVehicleByToken(token)
  if (!vehicle) throw new Error('リンクが無効です')

  const admin = createAdminClient()
  const { data: record } = await admin
    .from('touring_records')
    .select('id, created_by')
    .eq('id', recordId)
    .eq('vehicle_id', vehicle.id)
    .maybeSingle()
  if (!record) throw new Error('記録が見つかりません')
  if (record.created_by !== 'customer') {
    throw new Error('お店の記録は削除できません')
  }

  const { error } = await admin
    .from('touring_records')
    .delete()
    .eq('id', recordId)
  if (error) throw new Error(error.message)

  redirect(`/my/${token}`)
}
