/**
 * メール本文ビルダー
 * Phase 2 / Phase 6.7 のテキストメール。HTMLは将来追加。
 */

export type InspectionReminderParams = {
  shopName: string
  customerName: string
  vehicleModel: string | null
  vehiclePlate: string | null
  expiresOn: string // YYYY-MM-DD
  reminderLabel: '3ヶ月' | '1ヶ月' | '2週間'
}

export type WelcomeMailParams = {
  shopName: string
  shopPhone: string | null
  customerName: string
  vehicleModel: string | null
  vehiclePlate: string | null
  myPageUrl: string
}

export function buildWelcomeMailSubject(p: WelcomeMailParams): string {
  return `【${p.shopName}】愛車のご登録ありがとうございます`
}

export function buildWelcomeMailText(p: WelcomeMailParams): string {
  const vehicleLine = [p.vehicleModel, p.vehiclePlate]
    .filter(Boolean)
    .join(' / ')

  return `${p.customerName} 様

このたびは${p.shopName}への愛車のご登録、誠にありがとうございます。

下記の専用マイページから、ご登録いただいた情報や整備の記録を
いつでもご確認いただけます。

────────────────────
◆ あなたの愛車マイページ
${p.myPageUrl}
────────────────────

${vehicleLine ? `【ご登録のお車】\n${vehicleLine}\n` : ''}
● ホーム画面に追加して使うと便利です ●
このURLをスマホで開き、下記の手順で「ホーム画面に追加」しておくと
アプリのようにワンタップで開けるようになります。

【iPhone（Safari）】
1. ページを開いた状態で、下の「共有」ボタンをタップ
2. メニューを下にスクロールして「ホーム画面に追加」を選択
3. 右上の「追加」をタップ

【Android（Chrome）】
1. 右上の「︙」メニューをタップ
2. 「ホーム画面に追加」を選択

────────────────────
今後、車検時期が近づきましたらこちらのアドレスへ
${p.shopName}よりお知らせをお送りいたします。

ご不明な点があれば、お気軽にお問い合わせください。
${p.shopPhone ? `${p.shopName}：${p.shopPhone}` : p.shopName}

—
このメールは くるまカルテ から自動送信されています。
`
}

// ─────────────────────────────────────────────



export function buildInspectionReminderSubject(
  p: InspectionReminderParams
): string {
  return `【${p.shopName}】お車の車検のご案内（あと${p.reminderLabel}）`
}

// ─── 予約申し込み通知 (Phase B) ──────────────────────

export type ShopReservationNoticeParams = {
  to: string
  shopName: string
  customerName: string
  vehicleLabel: string
  desiredDate: string
  desiredSlot: string
  purpose: string
  customerNote: string | null
}

/**
 * 店主にお客様からの予約申し込みをメール通知。
 * 実送信は resend 経由。
 */
export async function sendShopReservationNotice(
  p: ShopReservationNoticeParams
): Promise<void> {
  const { sendMail } = await import('./resend')

  const slotJp =
    p.desiredSlot === 'morning'
      ? '午前'
      : p.desiredSlot === 'afternoon'
        ? '午後'
        : p.desiredSlot === 'evening'
          ? '夕方'
          : 'お任せ'

  const body = `${p.shopName} ご担当者様

くるまカルテ経由で、お客様から入庫予約のご相談が届きました。

────────────────────
◆ お客様情報
お名前：${p.customerName} 様
車両　：${p.vehicleLabel}

◆ ご希望
希望日：${p.desiredDate}
時間帯：${slotJp}
内容　：${p.purpose}
備考　：${p.customerNote ?? '（なし）'}
────────────────────

管理画面の「予約管理」から承認・調整できます。

—
このメールは くるまカルテ から自動送信されています。
`

  await sendMail({
    to: p.to,
    subject: `【${p.shopName}】入庫予約のご相談が届いています — ${p.customerName} 様`,
    text: body,
  })
}

// ───────────────────────────────────────────

export function buildInspectionReminderText(
  p: InspectionReminderParams
): string {
  const [y, m, d] = p.expiresOn.split('-')
  const expiresJP = `${y}年${m}月${d}日`

  return `${p.customerName} 様

いつも${p.shopName}をご利用いただきありがとうございます。

ご登録いただいているお車の車検満了日が
${expiresJP}（あと${p.reminderLabel}）に近づいてまいりました。

────────────────────
◆ お車の情報
車種　　：${p.vehicleModel ?? '（未登録）'}
ナンバー：${p.vehiclePlate ?? '（未登録）'}
車検満了：${expiresJP}
────────────────────

ご都合の良いタイミングで、車検のご予約・ご相談を
お願いいたします。お気軽にご連絡ください。

引き続きどうぞよろしくお願いいたします。

${p.shopName}

—
このメールは くるまカルテ から自動送信されています。
`
}
