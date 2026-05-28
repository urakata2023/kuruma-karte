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
  // Phase G: 3日程キャッチボール対応
  candidates?: { date: string; slot: string }[]
}

/**
 * 店主にお客様からの予約申し込みをメール通知。
 * 実送信は resend 経由。
 */
export async function sendShopReservationNotice(
  p: ShopReservationNoticeParams
): Promise<void> {
  const { sendMail } = await import('./resend')

  const slotLabel = (s: string) =>
    s === 'morning'
      ? '午前'
      : s === 'afternoon'
        ? '午後'
        : s === 'evening'
          ? '夕方'
          : 'お任せ'

  // 3日程キャッチボール: candidates が来てたら一覧表示
  const candidatesBlock =
    p.candidates && p.candidates.length > 0
      ? p.candidates
          .map(
            (c, i) =>
              `${['第1', '第2', '第3'][i] ?? `第${i + 1}`}希望：${c.date} (${slotLabel(c.slot)})`
          )
          .join('\n')
      : `希望日：${p.desiredDate}\n時間帯：${slotLabel(p.desiredSlot)}`

  const body = `${p.shopName} ご担当者様

くるまカルテ経由で、お客様から入庫予約のご相談が届きました。

────────────────────
◆ お客様情報
お名前：${p.customerName} 様
車両　：${p.vehicleLabel}

◆ ご希望日
${candidatesBlock}

◆ ご相談
内容　：${p.purpose}
備考　：${p.customerNote ?? '（なし）'}
────────────────────

管理画面の「予約管理」で：
  ・いずれかの希望日で承認する
  ・全部NGの場合は3日程の代替日を再提案する
  ・お断りメッセージを送る
のいずれかを返答できます。

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
// HTML メールテンプレート (Phase J)
// ヘッダー+カード+お店からメッセージ+フッター の高級レイアウト
// ───────────────────────────────────────────

export type EmailHtmlParams = {
  shopName: string
  shopPhone?: string | null
  customerName: string
  title: string // 例: "ご予約 確定のお知らせ"
  intro?: string // ヘッダー直下の前文 (任意)
  highlight?: {
    label: string // 例: "確定日時"
    value: string // 例: "2026年5月29日"
    sub?: string // 例: "11:00〜"
  }
  candidates?: {
    label: string
    items: { dateLabel: string; slotLabel: string }[]
  }
  message?: string // 「お店から」のひと言メッセージ
  ctaButton?: {
    label: string
    url: string
  }
  outro?: string // 締めの文章
}

const escapeHtml = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c] ?? c
  )

const nl2br = (s: string): string =>
  escapeHtml(s).replace(/\n/g, '<br>')

/**
 * 高級レイアウトのHTMLメール本文を生成。
 * インラインCSSのみ (Gmail等のメールクライアント互換性のため)。
 */
export function buildEmailHtml(p: EmailHtmlParams): string {
  const accent = '#18181b' // テーマプライマリ相当
  const cardBg = '#fafafa'
  const cardBorder = '#e4e4e7'
  const textSub = '#52525b'
  const textMute = '#71717a'

  const highlightBlock = p.highlight
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${cardBg};border:1px solid ${cardBorder};border-radius:10px;margin:0 0 24px 0;">
        <tr><td style="padding:24px;">
          <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${textMute};">${escapeHtml(p.highlight.label)}</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:${accent};line-height:1.2;">${escapeHtml(p.highlight.value)}</p>
          ${p.highlight.sub ? `<p style="margin:6px 0 0 0;font-size:15px;color:${textSub};font-weight:500;">${escapeHtml(p.highlight.sub)}</p>` : ''}
        </td></tr>
      </table>
    `
    : ''

  const candidatesBlock = p.candidates
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${cardBg};border:1px solid ${cardBorder};border-radius:10px;margin:0 0 24px 0;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 10px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${textMute};">${escapeHtml(p.candidates.label)}</p>
          ${p.candidates.items
            .map(
              (it) => `
            <p style="margin:0 0 4px 0;font-size:16px;color:${accent};font-weight:600;">
              ${escapeHtml(it.dateLabel)}
              <span style="font-size:13px;color:${textSub};font-weight:400;margin-left:8px;">${escapeHtml(it.slotLabel)}</span>
            </p>
          `
            )
            .join('')}
        </td></tr>
      </table>
    `
    : ''

  const messageBlock = p.message
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eff6ff;border-left:3px solid #2563eb;border-radius:6px;margin:0 0 24px 0;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 4px 0;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#1d4ed8;font-weight:700;">お店から</p>
          <p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.7;">${nl2br(p.message)}</p>
        </td></tr>
      </table>
    `
    : ''

  const ctaBlock = p.ctaButton
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
        <tr><td align="center">
          <a href="${escapeHtml(p.ctaButton.url)}"
             style="display:inline-block;padding:14px 32px;background:${accent};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
            ${escapeHtml(p.ctaButton.label)}
          </a>
        </td></tr>
      </table>
    `
    : ''

  const phoneBlock = p.shopPhone
    ? `<p style="margin:6px 0 0 0;font-size:13px;color:${textSub};">📞 <a href="tel:${escapeHtml(p.shopPhone)}" style="color:${textSub};text-decoration:none;">${escapeHtml(p.shopPhone)}</a></p>`
    : ''

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(p.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Sans','Yu Gothic UI',sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:40px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- ヘッダー (店舗ブランド) -->
        <tr><td style="background:linear-gradient(135deg,${accent} 0%,#3f3f46 100%);padding:32px 40px;color:#ffffff;">
          <p style="margin:0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;opacity:0.65;">For Our Customer</p>
          <h1 style="margin:6px 0 0 0;font-size:22px;font-weight:700;letter-spacing:0.02em;">${escapeHtml(p.shopName)}</h1>
        </td></tr>

        <!-- メイン -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 22px 0;font-size:15px;color:${accent};">${escapeHtml(p.customerName)} 様</p>
          <h2 style="margin:0 0 14px 0;font-size:24px;font-weight:700;color:${accent};line-height:1.4;">${escapeHtml(p.title)}</h2>
          ${p.intro ? `<p style="margin:0 0 28px 0;font-size:14px;color:${textSub};line-height:1.8;">${nl2br(p.intro)}</p>` : '<div style="height:8px;"></div>'}

          ${highlightBlock}
          ${candidatesBlock}
          ${messageBlock}
          ${ctaBlock}

          ${p.outro ? `<p style="margin:0;font-size:14px;color:${textSub};line-height:1.8;">${nl2br(p.outro)}</p>` : ''}
        </td></tr>

        <!-- フッター (店舗連絡先) -->
        <tr><td style="background:${cardBg};padding:22px 40px;border-top:1px solid ${cardBorder};">
          <p style="margin:0;font-size:13px;font-weight:600;color:${accent};">${escapeHtml(p.shopName)}</p>
          ${phoneBlock}
        </td></tr>

        <!-- くるまカルテブランド -->
        <tr><td style="background:${accent};padding:14px 40px;text-align:center;">
          <p style="margin:0;font-size:9px;letter-spacing:0.3em;color:#a1a1aa;text-transform:uppercase;">Powered by くるまカルテ</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
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
