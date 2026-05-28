import 'server-only'

/**
 * LINE Messaging API 連携 (Phase C)
 *
 * 公式アカウントへ直接 Push する経路。
 * Liny は別途 lib/liny.ts で実装 (タグ操作 API 経由)。
 */

const LINE_PUSH_ENDPOINT = 'https://api.line.me/v2/bot/message/push'

export type LineTextMessage = {
  type: 'text'
  text: string
}

export type LineFlexMessage = {
  type: 'flex'
  altText: string
  contents: unknown
}

export type LineMessage = LineTextMessage | LineFlexMessage

/**
 * 指定の userId に LINE メッセージを送る。
 * channelAccessToken が空 or null なら何もせず警告ログだけ。
 */
export async function sendLinePush(params: {
  channelAccessToken: string | null
  to: string | null
  messages: LineMessage[]
}): Promise<void> {
  if (!params.channelAccessToken || !params.to) {
    console.warn(
      '[sendLinePush] channelAccessToken または to が未設定。スキップ'
    )
    return
  }

  const res = await fetch(LINE_PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.channelAccessToken}`,
    },
    body: JSON.stringify({
      to: params.to,
      messages: params.messages.slice(0, 5), // LINE API は1回5件まで
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[sendLinePush] failed:', res.status, text)
    throw new Error(`LINE Push 失敗: ${res.status} ${text}`)
  }
}

/**
 * シンプルなテキスト1通だけ送る糖衣。
 */
export async function sendLineText(params: {
  channelAccessToken: string | null
  to: string | null
  text: string
}): Promise<void> {
  return sendLinePush({
    channelAccessToken: params.channelAccessToken,
    to: params.to,
    messages: [{ type: 'text', text: params.text }],
  })
}
