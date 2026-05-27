import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { processImageServerSide } from './image-server'

/**
 * 車検証写真から構造化データを抽出する結果。
 * 読み取れなかった項目は null。
 */
export type CertOcrResult = {
  model: string | null // 車種 (例: ハイエース ワイドミドル)
  plate_number: string | null // ナンバー (例: 川口 300 ち 6175)
  inspection_expires_on: string | null // 車検満了日 (YYYY-MM-DD)
  first_registration_ym: string | null // 初度登録年月 (YYYY-MM)
  vin: string | null // 車台番号 (任意)
  notes: string | null // モデルからの補足コメント
}

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Vercelの環境変数に追加してください。'
      )
    }
    _client = new Anthropic({ apiKey: key })
  }
  return _client
}

const SYSTEM_PROMPT = `あなたは日本の自動車検査証(車検証)の読み取り専門アシスタントです。
画像から以下の情報を厳密にJSONで抽出してください。読み取れない項目は null にしてください。
和暦 (令和、平成) は西暦に変換してください。令和元年=2019年、平成元年=1989年。

出力スキーマ:
{
  "model": "車名+型式の組み合わせ (例: トヨタ ハイエース、または ハリアー HEV)",
  "plate_number": "自動車登録番号 = ナンバー (例: 川口 300 ち 6175 のように地名+分類番号+ひらがな+一連番号、空白区切り)",
  "inspection_expires_on": "有効期間の満了する日 (車検満了日) を YYYY-MM-DD で。例: 令和8年4月26日 → 2026-04-26",
  "first_registration_ym": "初度登録年月 を YYYY-MM で。例: 令和6年4月 → 2024-04",
  "vin": "車台番号 (例: AXUH85-0035592)",
  "notes": "抽出時に気になった点があれば一言。なければ null"
}

必ず上記JSONのみを出力し、コードブロックや説明文は付けないでください。`

/**
 * 車検証画像をAnthropic Claude Vision APIで解析する。
 *
 * 画像は事前に processImageServerSide で正規化 (JPEG, 1920px長辺) してから送信。
 * モデル: claude-sonnet-4-5 (vision対応、コスト効率良し)
 */
export async function extractCertificateFromImage(
  file: File
): Promise<CertOcrResult> {
  // サーバー側で画像を JPEG化 + リサイズ (HEIC対応, サイズ削減)
  const { buffer } = await processImageServerSide(file)
  const base64 = buffer.toString('base64')

  const client = getClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64,
            },
          },
          {
            type: 'text',
            text: '画像の車検証から情報を抽出してJSONで返してください。',
          },
        ],
      },
    ],
  })

  // text blockだけ拾う
  const textBlock = message.content.find(
    (b): b is Anthropic.TextBlock => b.type === 'text'
  )
  if (!textBlock) {
    throw new Error('Vision APIから空のレスポンスが返りました')
  }

  // 念のためコードブロック除去
  let jsonStr = textBlock.text.trim()
  jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

  let parsed: Partial<CertOcrResult>
  try {
    parsed = JSON.parse(jsonStr) as Partial<CertOcrResult>
  } catch {
    throw new Error(
      `Vision APIの応答をJSONとして解釈できませんでした: ${jsonStr.slice(0, 200)}`
    )
  }

  return {
    model: nonEmpty(parsed.model),
    plate_number: nonEmpty(parsed.plate_number),
    inspection_expires_on: nonEmpty(parsed.inspection_expires_on),
    first_registration_ym: nonEmpty(parsed.first_registration_ym),
    vin: nonEmpty(parsed.vin),
    notes: nonEmpty(parsed.notes),
  }
}

function nonEmpty(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (!t || t.toLowerCase() === 'null') return null
  return t
}
