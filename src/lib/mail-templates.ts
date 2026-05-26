/**
 * 車検リマインドメールの本文ビルダー
 * Phase 2の最初はテキストメールのみ。HTMLは将来追加。
 */

export type InspectionReminderParams = {
  shopName: string
  customerName: string
  vehicleModel: string | null
  vehiclePlate: string | null
  expiresOn: string // YYYY-MM-DD
  reminderLabel: '3ヶ月' | '1ヶ月' | '2週間'
}

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
