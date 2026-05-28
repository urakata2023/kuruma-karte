'use server'

import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMail } from '@/lib/resend'
import { sendLineText } from '@/lib/line'
import { revalidatePath } from 'next/cache'
import type { DateCandidate } from '@/lib/types'
import { parseSlotValue, slotLabel } from '@/lib/reservation-slots'

const slotJp = slotLabel
const parseSlot = parseSlotValue

/**
 * お客様にメール (+ LINE) で返答を送る共通ヘルパー
 */
async function notifyCustomer(params: {
  vehicleId: string
  customerId: string
  subject: string
  body: string
  appUrl: string
}) {
  const admin = createAdminClient()
  const { data: customer } = await admin
    .from('customers')
    .select('email, line_user_id')
    .eq('id', params.customerId)
    .maybeSingle<{ email: string | null; line_user_id: string | null }>()

  if (customer?.email) {
    await sendMail({
      to: customer.email,
      subject: params.subject,
      text: params.body,
    })
  }
  // LINE 連携してる店舗で、お客様の line_user_id が分かれば LINE Push も
  const { data: vehicle } = await admin
    .from('vehicles')
    .select('shop_id')
    .eq('id', params.vehicleId)
    .maybeSingle<{ shop_id: string }>()
  if (vehicle && customer?.line_user_id) {
    const { data: shop } = await admin
      .from('shops')
      .select('line_channel_access_token')
      .eq('id', vehicle.shop_id)
      .maybeSingle<{ line_channel_access_token: string | null }>()
    if (shop?.line_channel_access_token) {
      await sendLineText({
        channelAccessToken: shop.line_channel_access_token,
        to: customer.line_user_id,
        text: `${params.subject}\n\n${params.body}`,
      })
    }
  }
}

/**
 * 店主が「いずれかの希望日で承認」する。
 */
export async function confirmReservation(
  reservationId: string,
  formData: FormData
): Promise<void> {
  const { shop } = await getCurrentShop()
  const admin = createAdminClient()

  const confirmed_date =
    ((formData.get('confirmed_date') as string) || '').trim() || null
  const confirmed_slot = parseSlot(formData.get('confirmed_slot'))
  const shop_note = ((formData.get('shop_note') as string) || '').trim() || null

  const { data: res } = await admin
    .from('reservations')
    .update({
      status: 'confirmed',
      confirmed_date,
      confirmed_slot,
      shop_note,
      round: 2,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('shop_id', shop.id)
    .select('customer_id, vehicle_id')
    .maybeSingle<{ customer_id: string; vehicle_id: string }>()

  if (res) {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'https://kuruma-karte.vercel.app'
    await notifyCustomer({
      vehicleId: res.vehicle_id,
      customerId: res.customer_id,
      subject: `【${shop.name}】ご予約 確定のお知らせ`,
      body: `お世話になっております、${shop.name}です。

ご予約いただいた整備のお日にちが確定しましたのでお知らせします。

────────────────────
確定日：${confirmed_date}
時間帯：${slotJp(confirmed_slot)}
────────────────────
${shop_note ? `\nお店から：\n${shop_note}\n` : ''}
当日、お気をつけてお越しください。
よろしくお願いいたします。

${shop.name}`,
      appUrl,
    })
  }

  revalidatePath('/reservations')
}

/**
 * 店主が「全部NG → 3日程の代替候補を再提案」する (Phase G の核)
 */
export async function proposeAlternativeDates(
  reservationId: string,
  formData: FormData
): Promise<void> {
  const { shop } = await getCurrentShop()
  const admin = createAdminClient()

  const alts: DateCandidate[] = [
    {
      date: ((formData.get('alt1_date') as string) || '').trim(),
      slot: parseSlot(formData.get('alt1_slot')),
    },
    {
      date: ((formData.get('alt2_date') as string) || '').trim(),
      slot: parseSlot(formData.get('alt2_slot')),
    },
    {
      date: ((formData.get('alt3_date') as string) || '').trim(),
      slot: parseSlot(formData.get('alt3_slot')),
    },
  ].filter((c) => c.date)

  if (alts.length === 0) {
    throw new Error('再提案の日程を1つ以上入れてください')
  }

  const shop_note =
    ((formData.get('shop_note') as string) || '').trim() ||
    'ご希望日が満員のため、別日でいかがでしょうか。'

  const { data: res } = await admin
    .from('reservations')
    .update({
      status: 'pending_customer',
      shop_candidate_dates: alts,
      shop_note,
      round: 2,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('shop_id', shop.id)
    .select('customer_id, vehicle_id')
    .maybeSingle<{ customer_id: string; vehicle_id: string }>()

  if (res) {
    // お客様のマイページURL取得
    const { data: vehicle } = await admin
      .from('vehicles')
      .select('view_token')
      .eq('id', res.vehicle_id)
      .maybeSingle<{ view_token: string }>()

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'https://kuruma-karte.vercel.app'
    const myPageUrl = vehicle
      ? `${appUrl}/my/${vehicle.view_token}`
      : appUrl

    const altsBlock = alts
      .map((c, i) => `候補${i + 1}：${c.date} (${slotJp(c.slot)})`)
      .join('\n')

    await notifyCustomer({
      vehicleId: res.vehicle_id,
      customerId: res.customer_id,
      subject: `【${shop.name}】ご予約 — 代替日のご提案`,
      body: `お世話になっております、${shop.name}です。

ご希望いただいたお日にちが満員のため、以下の代替候補をご提案させていただきます。

────────────────────
${altsBlock}
────────────────────

お店から：
${shop_note}

以下のリンクからご希望の候補をお選びください：
${myPageUrl}

ご都合に合わない場合は、お電話でも結構ですのでお気軽にご連絡ください。

${shop.name}`,
      appUrl,
    })
  }

  revalidatePath('/reservations')
}

export async function rejectReservation(
  reservationId: string,
  formData: FormData
): Promise<void> {
  const { shop } = await getCurrentShop()
  const admin = createAdminClient()

  const shop_note = ((formData.get('shop_note') as string) || '').trim() || null

  const { data: res } = await admin
    .from('reservations')
    .update({
      status: 'rejected',
      shop_note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('shop_id', shop.id)
    .select('customer_id, vehicle_id')
    .maybeSingle<{ customer_id: string; vehicle_id: string }>()

  if (res) {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'https://kuruma-karte.vercel.app'
    await notifyCustomer({
      vehicleId: res.vehicle_id,
      customerId: res.customer_id,
      subject: `【${shop.name}】ご予約について`,
      body: `お世話になっております、${shop.name}です。

このたびはご予約のリクエストをいただきありがとうございました。
誠に申し訳ありませんが、今回はお受けすることが難しい状況です。
${shop_note ? `\n${shop_note}\n` : ''}
ご不明な点はお気軽にお電話くださいませ。

${shop.name}`,
      appUrl,
    })
  }

  revalidatePath('/reservations')
}

export async function completeReservation(
  reservationId: string
): Promise<void> {
  const { shop } = await getCurrentShop()
  const admin = createAdminClient()

  await admin
    .from('reservations')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('shop_id', shop.id)

  revalidatePath('/reservations')
}
