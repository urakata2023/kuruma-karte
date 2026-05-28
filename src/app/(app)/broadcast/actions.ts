'use server'

import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMail } from '@/lib/resend'
import { logActivity } from '@/lib/activity-log'
import { buildEmailHtml } from '@/lib/mail-templates'
import { revalidatePath } from 'next/cache'

/**
 * 顧客一括メール送信 (Phase L - L)
 *
 * - 全顧客 or タグ絞り込み で対象選択
 * - 件名 + 本文 (テキスト) を入力
 * - 件名末尾に [自動配信] と入る (お客様向け透明性)
 * - Resend で配信、ログを activity_logs に記録
 */
export async function sendBroadcastEmail(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; ok?: true; sentCount?: number; skipped?: number }> {
  const { shop, userId } = await getCurrentShop()
  const admin = createAdminClient()

  const subject = ((formData.get('subject') as string) ?? '').trim()
  const body = ((formData.get('body') as string) ?? '').trim()
  const tagFilter = ((formData.get('tag_filter') as string) ?? 'all').trim()

  if (!subject) return { error: '件名を入力してください' }
  if (!body) return { error: '本文を入力してください' }

  // 対象顧客を取得 (メアド登録あり)
  let query = admin
    .from('customers')
    .select('id, name, email, tags')
    .eq('shop_id', shop.id)
    .not('email', 'is', null)

  if (tagFilter !== 'all') {
    query = query.contains('tags', [tagFilter])
  }

  const { data: customers, error } = await query

  if (error) return { error: error.message }
  const targets = (customers ?? []) as {
    id: string
    name: string
    email: string
    tags: string[] | null
  }[]

  if (targets.length === 0) {
    return { error: 'メールアドレスが登録されている対象顧客がいません' }
  }

  // 1件ずつ送信
  let sent = 0
  let skipped = 0
  for (const c of targets) {
    const html = buildEmailHtml({
      shopName: shop.name,
      shopPhone: shop.phone,
      customerName: c.name,
      title: subject,
      intro: body,
    })

    const result = await sendMail({
      to: c.email,
      subject: `【${shop.name}】${subject}`,
      text: `${c.name} 様\n\n${body}\n\n${shop.name}\n\n—\nこのメールは くるまカルテ から配信されています。`,
      html,
    })

    if (result.status === 'sent') {
      sent++
      await logActivity({
        shop_id: shop.id,
        user_id: userId,
        kind: 'notification_sent',
        target_type: 'customer',
        target_id: c.id,
        message: `📣 一括配信: ${c.name}様にメール送信成功 (${subject})`,
        channel: 'email',
        channel_status: 'sent',
        channel_recipient: c.email,
      })
    } else {
      skipped++
      await logActivity({
        shop_id: shop.id,
        user_id: userId,
        kind: 'notification_sent',
        target_type: 'customer',
        target_id: c.id,
        message: `⚠️ 一括配信スキップ/失敗: ${c.name}様 (${result.reason ?? 'unknown'})`,
        channel: 'email',
        channel_status: result.status,
        channel_recipient: c.email,
      })
    }
  }

  revalidatePath('/broadcast')
  revalidatePath('/activity')
  return { ok: true, sentCount: sent, skipped }
}
