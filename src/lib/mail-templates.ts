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
