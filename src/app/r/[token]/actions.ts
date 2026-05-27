'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

type State = { error?: string } | undefined

/**
 * 公開登録フォームのServer Action。
 * RLSなしのservice_roleを使うため、tokenの存在検証が必須。
 * tokenから shop_id を解決して、その shop に紐づけて customers / vehicles を作る。
 */
export async function registerCustomerVehicle(
  token: string,
  _prev: State,
  formData: FormData
): Promise<State> {
  const admin = createAdminClient()

  // 1. token 検証
  const { data: shop } = await admin
    .from('shops')
    .select('id, name')
    .eq('registration_token', token)
    .maybeSingle()
  if (!shop) return { error: 'このリンクは無効です。お店にご確認ください。' }

  // 2. 入力検証
  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return { error: 'お名前を入力してください' }
  const email = ((formData.get('email') as string) ?? '').trim()
  if (!email) return { error: 'メールアドレスを入力してください' }

  const phone = ((formData.get('phone') as string) ?? '').trim() || null
  const model = ((formData.get('model') as string) ?? '').trim() || null
  const plate_number =
    ((formData.get('plate_number') as string) ?? '').trim() || null
  const inspection_expires_on =
    ((formData.get('inspection_expires_on') as string) ?? '').trim() || null

  // 3. customer 作成
  const { data: customer, error: cErr } = await admin
    .from('customers')
    .insert({
      shop_id: shop.id,
      name,
      phone,
      email,
    })
    .select('id')
    .single()
  if (cErr || !customer) {
    return { error: `お客様情報の登録に失敗しました: ${cErr?.message ?? ''}` }
  }

  // 4. vehicle 作成（写真URLは後で更新）
  const { data: newVehicle, error: vErr } = await admin
    .from('vehicles')
    .insert({
      customer_id: customer.id,
      shop_id: shop.id,
      model,
      plate_number,
      inspection_expires_on,
    })
    .select('id')
    .single()
  if (vErr || !newVehicle) {
    return { error: `車両情報の登録に失敗しました: ${vErr?.message ?? ''}` }
  }

  // 5. 写真があればアップロード（service_role経由で RLS bypass）
  const photo = formData.get('photo')
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 10 * 1024 * 1024) {
      // サイズオーバーは無視（顧客と車は作成済み）
    } else {
      const ext = (photo.name.split('.').pop() ?? 'jpg').toLowerCase()
      const path = `${shop.id}/${newVehicle.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await admin.storage
        .from('vehicle-photos')
        .upload(path, photo, {
          cacheControl: '3600',
          upsert: true,
          contentType: photo.type || `image/${ext}`,
        })
      if (!uploadError) {
        const {
          data: { publicUrl },
        } = admin.storage.from('vehicle-photos').getPublicUrl(path)
        await admin
          .from('vehicles')
          .update({ photo_url: publicUrl })
          .eq('id', newVehicle.id)
      }
      // アップロード失敗してもエラー扱いしない（顧客登録自体は成功）
    }
  }

  redirect(`/r/${token}/done?name=${encodeURIComponent(name)}`)
}
