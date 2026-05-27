'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { processImageServerSide } from '@/lib/image-server'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import {
  buildWelcomeMailSubject,
  buildWelcomeMailText,
} from '@/lib/mail-templates'
import { redirect } from 'next/navigation'

type State = { error?: string } | undefined

/**
 * 公開登録フォームのServer Action。
 * RLSなしのservice_roleを使うため、tokenの存在検証が必須。
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
    .select('id, name, phone')
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

  // 4. vehicle 作成（view_token も取得）
  const { data: newVehicle, error: vErr } = await admin
    .from('vehicles')
    .insert({
      customer_id: customer.id,
      shop_id: shop.id,
      model,
      plate_number,
      inspection_expires_on,
    })
    .select('id, view_token')
    .single()
  if (vErr || !newVehicle) {
    return { error: `車両情報の登録に失敗しました: ${vErr?.message ?? ''}` }
  }

  // 5. 写真があればサーバー側で処理してアップロード
  const photo = formData.get('photo')
  if (
    photo instanceof File &&
    photo.size > 0 &&
    photo.size <= 20 * 1024 * 1024
  ) {
    try {
      const { buffer, ext, contentType } = await processImageServerSide(photo)
      const path = `${shop.id}/${newVehicle.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await admin.storage
        .from('vehicle-photos')
        .upload(path, buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType,
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
    } catch (e) {
      console.warn('写真処理に失敗（顧客・車両登録は成功）:', e)
    }
  }

  // 6. ウェルカムメール送信（マイページURLを案内）
  //    Resend未設定でも登録自体は成功扱いにする
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://kuruma-karte.vercel.app'
  const myPageUrl = `${appUrl}/my/${newVehicle.view_token}`
  try {
    if (process.env.RESEND_API_KEY) {
      const resend = getResend()
      const params = {
        shopName: shop.name,
        shopPhone: shop.phone,
        customerName: name,
        vehicleModel: model,
        vehiclePlate: plate_number,
        myPageUrl,
      }
      await resend.emails.send({
        from: `${shop.name} <${FROM_EMAIL}>`,
        to: email,
        subject: buildWelcomeMailSubject(params),
        text: buildWelcomeMailText(params),
      })
    } else {
      console.info('RESEND_API_KEY未設定のためウェルカムメール送信スキップ')
    }
  } catch (e) {
    console.warn('ウェルカムメール送信失敗（登録は成功）:', e)
  }

  // 7. 完了画面へ（view_token を渡してマイページへの導線に使う）
  redirect(
    `/r/${token}/done?name=${encodeURIComponent(name)}&view=${newVehicle.view_token}`
  )
}
