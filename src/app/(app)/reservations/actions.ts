'use server'

import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMail } from '@/lib/resend'
import { sendLineText } from '@/lib/line'
import { logActivity } from '@/lib/activity-log'
import { buildEmailHtml } from '@/lib/mail-templates'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { DateCandidate } from '@/lib/types'
import { parseSlotValue, slotLabel } from '@/lib/reservation-slots'

const slotJp = slotLabel
const parseSlot = parseSlotValue

/**
 * Server Action 完了後にトーストを出すための redirect ヘルパー
 */
function toastRedirect(message: string, type: 'ok' | 'err' = 'ok'): never {
  redirect(
    `/reservations?toast=${type}&msg=${encodeURIComponent(message)}`
  )
}

/**
 * お客様にメール (+ LINE) で返答を送る共通ヘルパー
 * 送信成否を activity_logs に記録する。
 */
async function notifyCustomer(params: {
  shopId: string
  vehicleId: string
  customerId: string
  customerName: string
  subject: string
  body: string
  html?: string
  appUrl: string
}) {
  const admin = createAdminClient()
  const { data: customer } = await admin
    .from('customers')
    .select('email, line_user_id')
    .eq('id', params.customerId)
    .maybeSingle<{ email: string | null; line_user_id: string | null }>()

  // メール送信 (戻り値 sent/skipped/failed を見て正直にログ記録)
  if (customer?.email) {
    const result = await sendMail({
      to: customer.email,
      subject: params.subject,
      text: params.body,
      html: params.html,
    })

    if (result.status === 'sent') {
      await logActivity({
        shop_id: params.shopId,
        kind: 'notification_sent',
        target_type: 'customer',
        target_id: params.customerId,
        message: `📧 ${params.customerName}様にメール送信成功: ${params.subject}`,
        channel: 'email',
        channel_status: 'sent',
        channel_recipient: customer.email,
        metadata: { messageId: result.messageId },
      })
    } else if (result.status === 'skipped') {
      await logActivity({
        shop_id: params.shopId,
        kind: 'notification_sent',
        target_type: 'customer',
        target_id: params.customerId,
        message: `⏭️ メール送信スキップ (${result.reason}) — ${params.customerName}様: ${params.subject}`,
        channel: 'email',
        channel_status: 'skipped',
        channel_recipient: customer.email,
        metadata: { reason: result.reason },
      })
    } else {
      await logActivity({
        shop_id: params.shopId,
        kind: 'notification_sent',
        target_type: 'customer',
        target_id: params.customerId,
        message: `⚠️ ${params.customerName}様へのメール送信失敗: ${result.reason}`,
        channel: 'email',
        channel_status: 'failed',
        channel_recipient: customer.email,
        metadata: { reason: result.reason },
      })
    }
  }

  // LINE 連携してる店舗で、お客様の line_user_id が分かれば LINE Push も
  if (customer?.line_user_id) {
    const { data: shop } = await admin
      .from('shops')
      .select('line_channel_access_token')
      .eq('id', params.shopId)
      .maybeSingle<{ line_channel_access_token: string | null }>()

    if (!shop?.line_channel_access_token) {
      // LINE 設定なし → skipped
      await logActivity({
        shop_id: params.shopId,
        kind: 'notification_sent',
        target_type: 'customer',
        target_id: params.customerId,
        message: `⏭️ LINE送信スキップ (LINE Channel Token 未設定) — ${params.customerName}様`,
        channel: 'line',
        channel_status: 'skipped',
        channel_recipient: customer.line_user_id,
      })
    } else {
      try {
        await sendLineText({
          channelAccessToken: shop.line_channel_access_token,
          to: customer.line_user_id,
          text: `${params.subject}\n\n${params.body}`,
        })
        await logActivity({
          shop_id: params.shopId,
          kind: 'notification_sent',
          target_type: 'customer',
          target_id: params.customerId,
          message: `💬 ${params.customerName}様にLINE送信成功`,
          channel: 'line',
          channel_status: 'sent',
          channel_recipient: customer.line_user_id,
        })
      } catch (e) {
        console.error('LINE send failed:', e)
        await logActivity({
          shop_id: params.shopId,
          kind: 'notification_sent',
          target_type: 'customer',
          target_id: params.customerId,
          message: `⚠️ ${params.customerName}様へのLINE送信失敗: ${e instanceof Error ? e.message : ''}`,
          channel: 'line',
          channel_status: 'failed',
        })
      }
    }
  }
}

/**
 * 「いずれかの希望日で承認」
 */
export async function confirmReservation(
  reservationId: string,
  formData: FormData
): Promise<void> {
  const { shop, userId } = await getCurrentShop()
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

  if (!res) {
    revalidatePath('/reservations')
    toastRedirect('予約が見つかりませんでした', 'err')
  }

  // 顧客名取得 (ログ用)
  const { data: customer } = await admin
    .from('customers')
    .select('name')
    .eq('id', res.customer_id)
    .maybeSingle<{ name: string }>()
  const custName = customer?.name ?? 'お客様'

  // お客様通知
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://kuruma-karte.vercel.app'

  // 日本語の日付表示
  const dateJp = confirmed_date
    ? confirmed_date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1年$2月$3日')
    : '—'

  const subject = `【${shop.name}】ご予約 確定のお知らせ`
  const textBody = `お世話になっております、${shop.name}です。

ご予約いただいた整備のお日にちが確定しましたのでお知らせします。

────────────────────
確定日：${dateJp}
時間帯：${slotJp(confirmed_slot)}
────────────────────
${shop_note ? `\nお店から：\n${shop_note}\n` : ''}
当日、お気をつけてお越しください。
よろしくお願いいたします。

${shop.name}`

  const htmlBody = buildEmailHtml({
    shopName: shop.name,
    shopPhone: shop.phone,
    customerName: custName,
    title: '✓ ご予約 確定のお知らせ',
    intro: 'ご予約いただいた整備のお日にちが確定しましたのでお知らせします。',
    highlight: {
      label: '確定日時',
      value: dateJp,
      sub: slotJp(confirmed_slot),
    },
    message: shop_note ?? undefined,
    outro: '当日、お気をつけてお越しください。\nよろしくお願いいたします。',
  })

  await notifyCustomer({
    shopId: shop.id,
    vehicleId: res.vehicle_id,
    customerId: res.customer_id,
    customerName: custName,
    subject,
    body: textBody,
    html: htmlBody,
    appUrl,
  })

  // 操作ログ
  await logActivity({
    shop_id: shop.id,
    user_id: userId,
    kind: 'reservation_confirmed',
    target_type: 'reservation',
    target_id: reservationId,
    message: `✅ ${custName}様の予約を ${confirmed_date} (${slotJp(confirmed_slot)}) で確定`,
    metadata: { confirmed_date, confirmed_slot },
  })

  revalidatePath('/reservations')
  toastRedirect(
    `✅ ${custName}様の予約を ${confirmed_date} (${slotJp(confirmed_slot)}) で確定 — お客様にメール送信しました`
  )
}

/**
 * 「全部NG → 3日程の代替候補を再提案」
 */
export async function proposeAlternativeDates(
  reservationId: string,
  formData: FormData
): Promise<void> {
  const { shop, userId } = await getCurrentShop()
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
    toastRedirect('再提案の日程を1つ以上入れてください', 'err')
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

  if (!res) {
    revalidatePath('/reservations')
    toastRedirect('予約が見つかりませんでした', 'err')
  }

  const { data: customer } = await admin
    .from('customers')
    .select('name')
    .eq('id', res.customer_id)
    .maybeSingle<{ name: string }>()
  const custName = customer?.name ?? 'お客様'

  const { data: vehicle } = await admin
    .from('vehicles')
    .select('view_token')
    .eq('id', res.vehicle_id)
    .maybeSingle<{ view_token: string }>()

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://kuruma-karte.vercel.app'
  const myPageUrl = vehicle ? `${appUrl}/my/${vehicle.view_token}` : appUrl

  const formatDate = (d: string) =>
    d.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1年$2月$3日')

  const altsBlock = alts
    .map((c, i) => `候補${i + 1}：${formatDate(c.date)} (${slotJp(c.slot)})`)
    .join('\n')

  const subject = `【${shop.name}】ご予約 — 代替日のご提案`
  const textBody = `お世話になっております、${shop.name}です。

ご希望いただいたお日にちが満員のため、以下の代替候補をご提案させていただきます。

────────────────────
${altsBlock}
────────────────────

お店から：
${shop_note}

以下のリンクからご希望の候補をお選びください：
${myPageUrl}

ご都合に合わない場合は、お電話でも結構ですのでお気軽にご連絡ください。

${shop.name}`

  const htmlBody = buildEmailHtml({
    shopName: shop.name,
    shopPhone: shop.phone,
    customerName: custName,
    title: '📅 代替日のご提案',
    intro:
      'ご希望いただいたお日にちが満員のため、以下の代替候補をご提案させていただきます。',
    candidates: {
      label: '代替候補',
      items: alts.map((c, i) => ({
        dateLabel: `候補${i + 1}：${formatDate(c.date)}`,
        slotLabel: slotJp(c.slot),
      })),
    },
    message: shop_note,
    ctaButton: { label: 'ご希望の候補を選ぶ', url: myPageUrl },
    outro:
      'ご都合に合わない場合は、お電話でも結構ですのでお気軽にご連絡ください。',
  })

  await notifyCustomer({
    shopId: shop.id,
    vehicleId: res.vehicle_id,
    customerId: res.customer_id,
    customerName: custName,
    subject,
    body: textBody,
    html: htmlBody,
    appUrl,
  })

  await logActivity({
    shop_id: shop.id,
    user_id: userId,
    kind: 'reservation_proposed',
    target_type: 'reservation',
    target_id: reservationId,
    message: `📅 ${custName}様に代替3日程を提案`,
    metadata: { alts },
  })

  revalidatePath('/reservations')
  toastRedirect(
    `📅 ${custName}様に代替3日程を再提案しました — お客様にメール送信済み`
  )
}

export async function rejectReservation(
  reservationId: string,
  formData: FormData
): Promise<void> {
  const { shop, userId } = await getCurrentShop()
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

  if (!res) {
    revalidatePath('/reservations')
    toastRedirect('予約が見つかりませんでした', 'err')
  }

  const { data: customer } = await admin
    .from('customers')
    .select('name')
    .eq('id', res.customer_id)
    .maybeSingle<{ name: string }>()
  const custName = customer?.name ?? 'お客様'

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://kuruma-karte.vercel.app'

  const subject = `【${shop.name}】ご予約について`
  const textBody = `お世話になっております、${shop.name}です。

このたびはご予約のリクエストをいただきありがとうございました。
誠に申し訳ありませんが、今回はお受けすることが難しい状況です。
${shop_note ? `\n${shop_note}\n` : ''}
ご不明な点はお気軽にお電話くださいませ。

${shop.name}`

  const htmlBody = buildEmailHtml({
    shopName: shop.name,
    shopPhone: shop.phone,
    customerName: custName,
    title: 'ご予約について',
    intro: `このたびはご予約のリクエストをいただきありがとうございました。\n誠に申し訳ありませんが、今回はお受けすることが難しい状況です。`,
    message: shop_note ?? undefined,
    outro: 'ご不明な点はお気軽にお電話くださいませ。',
  })

  await notifyCustomer({
    shopId: shop.id,
    vehicleId: res.vehicle_id,
    customerId: res.customer_id,
    customerName: custName,
    subject,
    body: textBody,
    html: htmlBody,
    appUrl,
  })

  await logActivity({
    shop_id: shop.id,
    user_id: userId,
    kind: 'reservation_rejected',
    target_type: 'reservation',
    target_id: reservationId,
    message: `❌ ${custName}様の予約をお断り`,
  })

  revalidatePath('/reservations')
  toastRedirect(`${custName}様の予約をお断りしました — お客様にメール送信済み`)
}

export async function completeReservation(
  reservationId: string
): Promise<void> {
  const { shop, userId } = await getCurrentShop()
  const admin = createAdminClient()

  const { data: res } = await admin
    .from('reservations')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('shop_id', shop.id)
    .select('customer_id')
    .maybeSingle<{ customer_id: string }>()

  if (res) {
    const { data: customer } = await admin
      .from('customers')
      .select('name')
      .eq('id', res.customer_id)
      .maybeSingle<{ name: string }>()
    const custName = customer?.name ?? 'お客様'

    await logActivity({
      shop_id: shop.id,
      user_id: userId,
      kind: 'reservation_completed',
      target_type: 'reservation',
      target_id: reservationId,
      message: `🏁 ${custName}様の予約を入庫済みに変更`,
    })

    revalidatePath('/reservations')
    toastRedirect(`🏁 ${custName}様の予約を入庫済みに変更しました`)
  } else {
    revalidatePath('/reservations')
    toastRedirect('予約が見つかりませんでした', 'err')
  }
}
