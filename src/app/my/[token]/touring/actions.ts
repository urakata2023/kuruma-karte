'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { processImageServerSide } from '@/lib/image-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type State = { error?: string } | undefined

/**
 * 住所文字列から緯度経度を取得（OpenStreetMap Nominatim 経由）。
 * 無料・APIキー不要だが、Nominatimの利用規約上 User-Agent 必須・1req/sec推奨。
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const trimmed = address.trim()
  if (!trimmed) return null

  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({
      q: trimmed,
      format: 'json',
      limit: '1',
      'accept-language': 'ja',
    }).toString()

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'kuruma-karte/1.0 (https://kuruma-karte.vercel.app)',
      },
    })
    if (!res.ok) return null
    const data = (await res.json()) as Array<{
      lat: string
      lon: string
      display_name: string
    }>
    if (!Array.isArray(data) || data.length === 0) return null
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    }
  } catch {
    return null
  }
}

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

/**
 * 座標が空で住所がある場合、Nominatimで自動取得する。
 * 既に座標があればそのまま返す。
 */
async function resolveCoordinates(
  formData: FormData
): Promise<{ latitude: number | null; longitude: number | null }> {
  let latitude = parseFloat0(formData, 'latitude')
  let longitude = parseFloat0(formData, 'longitude')

  if (latitude == null || longitude == null) {
    // place_name を address より優先（"芦ノ湖" だけで通る）
    const place = parseString(formData, 'place_name')
    const address = parseString(formData, 'address')
    const query = place ?? address
    if (query) {
      const geo = await geocodeAddress(query)
      if (geo) {
        latitude = geo.lat
        longitude = geo.lng
      }
    }
  }

  return { latitude, longitude }
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

  // 座標を自動解決（住所/場所名から自動ジオコーディング）
  const { latitude, longitude } = await resolveCoordinates(formData)

  const admin = createAdminClient()
  const { error } = await admin.from('touring_records').insert({
    vehicle_id: vehicle.id,
    shop_id: vehicle.shop_id,
    touring_date,
    title,
    place_name: parseString(formData, 'place_name'),
    address: parseString(formData, 'address'),
    latitude,
    longitude,
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

  const { latitude, longitude } = await resolveCoordinates(formData)

  const { error } = await admin
    .from('touring_records')
    .update({
      title,
      touring_date,
      place_name: parseString(formData, 'place_name'),
      address: parseString(formData, 'address'),
      latitude,
      longitude,
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

/**
 * 既存記録に対して、住所/場所名から座標を再取得して上書き保存する。
 * エラー時もthrowせず、redirect で /my/[token] にバナー表示用パラメータを付けて戻す。
 */
export async function refreshTouringCoordinates(
  token: string,
  recordId: string
): Promise<void> {
  const back = (params: string) => redirect(`/my/${token}?${params}`)

  const vehicle = await resolveVehicleByToken(token)
  if (!vehicle) {
    back('toast=err&msg=' + encodeURIComponent('リンクが無効です'))
    return
  }

  const admin = createAdminClient()
  const { data: record } = await admin
    .from('touring_records')
    .select('id, place_name, address')
    .eq('id', recordId)
    .eq('vehicle_id', vehicle.id)
    .maybeSingle()
  if (!record) {
    back('toast=err&msg=' + encodeURIComponent('記録が見つかりません'))
    return
  }

  // place_name → address の順で試す
  const candidates = [record.place_name, record.address].filter(
    (q): q is string => !!q && q.trim().length > 0
  )
  if (candidates.length === 0) {
    back(
      'toast=err&msg=' +
        encodeURIComponent('住所も場所の名前も登録されていません')
    )
    return
  }

  let geo: { lat: number; lng: number } | null = null
  let triedFirst = false
  for (const q of candidates) {
    if (triedFirst) {
      // 連続リクエストはNominatimのレート制限考慮で軽くwait
      await new Promise((r) => setTimeout(r, 1100))
    }
    const r = await geocodeAddress(q)
    if (r) {
      geo = { lat: r.lat, lng: r.lng }
      break
    }
    triedFirst = true
  }

  if (!geo) {
    back(
      'toast=err&msg=' +
        encodeURIComponent(
          `場所が見つかりませんでした(${candidates.join(' / ')})。もう少し具体的な住所をお試しください`
        )
    )
    return
  }

  const { error } = await admin
    .from('touring_records')
    .update({ latitude: geo.lat, longitude: geo.lng })
    .eq('id', recordId)
  if (error) {
    back('toast=err&msg=' + encodeURIComponent('保存に失敗: ' + error.message))
    return
  }

  revalidatePath(`/my/${token}`)
  back('toast=ok&msg=' + encodeURIComponent('地図に追加しました'))
}
