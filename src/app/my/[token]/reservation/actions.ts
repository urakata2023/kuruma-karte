'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendShopReservationNotice } from '@/lib/mail-templates'
import { sendLineText } from '@/lib/line'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ReservationFormState = { error?: string } | undefined

/**
 * お客様マイページからの予約申し込み (Phase B)
 *
 * - view_token から vehicle/customer/shop を特定
 * - reservations にレコード追加 (status='requested')
 * - 店主にはメールで通知 (任意)
 */
export async function requestReservation(
  token: string,
  _prev: ReservationFormState,
  formData: FormData
): Promise<ReservationFormState> {
  const admin = createAdminClient()

  const { data: vehicle } = await admin
    .from('vehicles')
    .select('id, customer_id, shop_id, model, plate_number')
    .eq('view_token', token)
    .maybeSingle()
  if (!vehicle) return { error: '車両が見つかりません' }

  const desired_date = (formData.get('desired_date') as string)?.trim()
  const desired_slot = (formData.get('desired_slot') as string)?.trim() || 'any'
  const purpose = (formData.get('purpose') as string)?.trim()
  const customer_note = (formData.get('customer_note') as string)?.trim() || null

  if (!desired_date) return { error: 'ご希望日を入力してください' }
  if (!purpose) return { error: 'ご相談内容を入力してください' }

  const { error } = await admin.from('reservations').insert({
    shop_id: vehicle.shop_id,
    customer_id: vehicle.customer_id,
    vehicle_id: vehicle.id,
    desired_date,
    desired_slot,
    purpose,
    customer_note,
    status: 'requested',
  })
  if (error) return { error: error.message }

  // 店主にメール通知 (任意)
  try {
    const [{ data: customer }, { data: shop }] = await Promise.all([
      admin
        .from('customers')
        .select('name')
        .eq('id', vehicle.customer_id)
        .maybeSingle<{ name: string }>(),
      admin
        .from('shops')
        .select('owner_user_id, name')
        .eq('id', vehicle.shop_id)
        .maybeSingle<{ owner_user_id: string; name: string }>(),
    ])

    if (shop && customer) {
      // 店主のメールアドレスを auth.users から取得
      const { data: ownerUser } = await admin.auth.admin.getUserById(
        shop.owner_user_id
      )
      if (ownerUser?.user?.email) {
        await sendShopReservationNotice({
          to: ownerUser.user.email,
          shopName: shop.name,
          customerName: customer.name,
          vehicleLabel:
            `${vehicle.model ?? '車両'}${vehicle.plate_number ? ` (${vehicle.plate_number})` : ''}`,
          desiredDate: desired_date,
          desiredSlot: desired_slot,
          purpose,
          customerNote: customer_note,
        })
      }

      // LINE 連携が設定されていれば LINE Push でも通知
      const { data: shopLine } = await admin
        .from('shops')
        .select('line_channel_access_token, line_owner_user_id')
        .eq('id', vehicle.shop_id)
        .maybeSingle<{
          line_channel_access_token: string | null
          line_owner_user_id: string | null
        }>()

      if (shopLine?.line_channel_access_token && shopLine.line_owner_user_id) {
        const lineText = `🔔 新しい入庫予約リクエストが届きました\n\n👤 ${customer.name} 様\n🚗 ${vehicle.model ?? '車両'}${vehicle.plate_number ? ` (${vehicle.plate_number})` : ''}\n📅 希望: ${desired_date} (${desired_slot})\n💬 ${purpose}\n\n管理画面の予約管理から承認できます。`
        await sendLineText({
          channelAccessToken: shopLine.line_channel_access_token,
          to: shopLine.line_owner_user_id,
          text: lineText,
        })
      }
    }
  } catch (e) {
    console.error('予約通知メール失敗 (続行):', e)
  }

  revalidatePath(`/my/${token}`)
  redirect(`/my/${token}?toast=ok&msg=${encodeURIComponent('ご予約リクエストを送信しました。お店からの返答をお待ちください。')}`)
}
