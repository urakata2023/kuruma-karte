'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendShopReservationNotice } from '@/lib/mail-templates'
import { sendLineText } from '@/lib/line'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { DateCandidate, SlotKind } from '@/lib/types'

export type ReservationFormState = { error?: string } | undefined

function parseSlot(v: unknown): SlotKind {
  if (v === 'morning' || v === 'afternoon' || v === 'evening' || v === 'any') {
    return v
  }
  return 'any'
}

function pickCandidate(
  formData: FormData,
  dateKey: string,
  slotKey: string
): DateCandidate | null {
  const date = ((formData.get(dateKey) as string) || '').trim()
  if (!date) return null
  return { date, slot: parseSlot(formData.get(slotKey)) }
}

/**
 * お客様マイページからの予約申し込み (Phase G)
 *
 * 第1〜第3希望日を受け取り、reservations.candidate_dates に JSON で保存。
 * 旧 desired_date / desired_slot にも第1希望を入れて互換性を確保。
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

  // 第1〜第3希望日を集める
  const candidates: DateCandidate[] = [
    pickCandidate(formData, 'candidate1_date', 'candidate1_slot'),
    pickCandidate(formData, 'candidate2_date', 'candidate2_slot'),
    pickCandidate(formData, 'candidate3_date', 'candidate3_slot'),
  ].filter((c): c is DateCandidate => c !== null)

  if (candidates.length === 0) {
    return { error: 'ご希望日を1つ以上ご入力ください' }
  }

  const purpose = (formData.get('purpose') as string)?.trim()
  const customer_note = (formData.get('customer_note') as string)?.trim() || null

  if (!purpose) return { error: 'ご相談内容を入力してください' }

  const first = candidates[0]
  const { error } = await admin.from('reservations').insert({
    shop_id: vehicle.shop_id,
    customer_id: vehicle.customer_id,
    vehicle_id: vehicle.id,
    desired_date: first.date,
    desired_slot: first.slot,
    purpose,
    customer_note,
    candidate_dates: candidates,
    shop_candidate_dates: [],
    round: 1,
    status: 'pending_shop',
  })
  if (error) return { error: error.message }

  // 店主への通知 (メール + LINE)
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
          desiredDate: first.date,
          desiredSlot: first.slot,
          purpose,
          customerNote: customer_note,
          candidates,
        })
      }

      // LINE 連携が有効なら Push 通知
      const { data: shopLine } = await admin
        .from('shops')
        .select('line_channel_access_token, line_owner_user_id')
        .eq('id', vehicle.shop_id)
        .maybeSingle<{
          line_channel_access_token: string | null
          line_owner_user_id: string | null
        }>()

      if (shopLine?.line_channel_access_token && shopLine.line_owner_user_id) {
        const candidatesText = candidates
          .map(
            (c, i) =>
              `${['第1', '第2', '第3'][i]}希望: ${c.date} (${slotJp(c.slot)})`
          )
          .join('\n')

        const lineText = `🔔 新しい入庫予約リクエスト\n\n👤 ${customer.name} 様\n🚗 ${vehicle.model ?? '車両'}${vehicle.plate_number ? ` (${vehicle.plate_number})` : ''}\n\n📅 希望日:\n${candidatesText}\n\n💬 ${purpose}\n\n管理画面の予約管理から返答できます。`
        await sendLineText({
          channelAccessToken: shopLine.line_channel_access_token,
          to: shopLine.line_owner_user_id,
          text: lineText,
        })
      }
    }
  } catch (e) {
    console.error('予約通知失敗 (続行):', e)
  }

  revalidatePath(`/my/${token}`)
  redirect(
    `/my/${token}?toast=ok&msg=${encodeURIComponent(
      'ご予約リクエストを送信しました。お店から日程確認のメールが届きます。'
    )}`
  )
}

/**
 * お客様が店主の再提案を確認して、いずれかを承認する。
 */
export async function acceptShopProposal(
  token: string,
  reservationId: string,
  formData: FormData
): Promise<void> {
  const admin = createAdminClient()

  const { data: vehicle } = await admin
    .from('vehicles')
    .select('id, shop_id, customer_id, model, plate_number')
    .eq('view_token', token)
    .maybeSingle()
  if (!vehicle) throw new Error('車両が見つかりません')

  const acceptedDate = ((formData.get('accepted_date') as string) || '').trim()
  const acceptedSlot = parseSlot(formData.get('accepted_slot'))
  if (!acceptedDate) throw new Error('日付が選択されていません')

  await admin
    .from('reservations')
    .update({
      confirmed_date: acceptedDate,
      confirmed_slot: acceptedSlot,
      status: 'confirmed',
      round: 3,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('vehicle_id', vehicle.id)

  // 店主にメール + LINE で確定通知
  try {
    const [{ data: customer }, { data: shop }] = await Promise.all([
      admin
        .from('customers')
        .select('name')
        .eq('id', vehicle.customer_id)
        .maybeSingle<{ name: string }>(),
      admin
        .from('shops')
        .select(
          'owner_user_id, name, line_channel_access_token, line_owner_user_id'
        )
        .eq('id', vehicle.shop_id)
        .maybeSingle<{
          owner_user_id: string
          name: string
          line_channel_access_token: string | null
          line_owner_user_id: string | null
        }>(),
    ])
    if (shop && customer) {
      const { data: ownerUser } = await admin.auth.admin.getUserById(
        shop.owner_user_id
      )
      const { sendMail } = await import('@/lib/resend')
      if (ownerUser?.user?.email) {
        await sendMail({
          to: ownerUser.user.email,
          subject: `【${shop.name}】予約確定 — ${customer.name} 様 / ${acceptedDate}`,
          text: `${customer.name} 様より、再提案いただいた日程で予約確定の返答が届きました。

────────────────────
確定日：${acceptedDate} (${slotJp(acceptedSlot)})
車両　：${vehicle.model ?? '車両'}${vehicle.plate_number ? ` (${vehicle.plate_number})` : ''}
────────────────────

管理画面でご確認ください。`,
        })
      }
      if (shop.line_channel_access_token && shop.line_owner_user_id) {
        await sendLineText({
          channelAccessToken: shop.line_channel_access_token,
          to: shop.line_owner_user_id,
          text: `✅ ${customer.name}様 予約確定\n${acceptedDate} (${slotJp(acceptedSlot)})`,
        })
      }
    }
  } catch (e) {
    console.error('確定通知失敗:', e)
  }

  revalidatePath(`/my/${token}`)
  redirect(
    `/my/${token}?toast=ok&msg=${encodeURIComponent(
      `${acceptedDate} で予約確定しました。お店にてお待ちしております。`
    )}`
  )
}

function slotJp(s: SlotKind | null | undefined): string {
  if (s === 'morning') return '午前'
  if (s === 'afternoon') return '午後'
  if (s === 'evening') return '夕方'
  return 'お任せ'
}
