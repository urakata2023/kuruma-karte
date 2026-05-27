import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { processImageServerSide } from './image-server'

/**
 * 車検証写真から構造化データを抽出する結果。
 * 読み取れなかった項目は null。
 *
 * 2023年1月から導入された「電子車検証 (A6サイズ)」は、有効期間の満了する日が
 * ICチップ内に格納されており紙には印字されない。
 * その場合 inspection_expires_on は null になり、is_electronic_cert: true となる。
 * クライアント側で registration_date + 用途別の有効期間 から推定値を計算する。
 */
export type CertOcrResult = {
  model: string | null // 車種 (例: ハイエース ワイドミドル)
  plate_number: string | null // ナンバー (例: 川口 300 ち 6175)
  inspection_expires_on: string | null // 車検満了日 (YYYY-MM-DD) — 電子車検証では null
  first_registration_ym: string | null // 初度登録年月 (YYYY-MM)
  registration_date: string | null // 登録年月日 / 交付年月日 (YYYY-MM-DD) — 新車判定と推定計算に使用
  vin: string | null // 車台番号 (任意)
  usage: 'private_passenger' | 'private_cargo' | 'commercial' | null // 用途 (自家用乗用 / 自家用貨物 / 事業用)
  is_electronic_cert: boolean // A6サイズの電子車検証なら true
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

【重要：2種類の車検証】
日本の車検証には大小2種類があります：
1. 旧車検証 (A4サイズ、〜2022年) → 有効期間の満了する日が紙に印字されている
2. 電子車検証 (A6サイズ、普通車は2023年1月〜、軽は2024年1月〜) → 満了日はICチップ内のみで、紙には印字されていない

電子車検証の見分け方:
- A6サイズ (旧車検証の半分)
- 右上などに「電子車検証」「自動車検査証」+ ICチップマーク
- 「有効期間の満了する日」というラベルがあっても値が空欄、または満了日のフィールド自体が存在しない
- 「自動車検査証記録事項」という別紙とセットで運用される

電子車検証だと判断したら、inspection_expires_on は必ず null にして、is_electronic_cert を true にしてください。
紙に書いていない満了日を推測で埋めることは絶対にしないでください。

【日付の読み取り注意点】
和暦の漢数字「八」と「九」、「六」と「八」は見間違えやすいので、論理的に検算してください：
- 自家用乗用車・新車 → 初度登録から3年後が初回車検
- 自家用乗用車・継続 → 前回車検から2年後
読み取った満了日が論理と合わない場合は notes に明記してください。

出力スキーマ:
{
  "model": "車名+型式の組み合わせ (例: トヨタ ハイエース、または ハリアー HEV)。車名欄＋型式欄を組み合わせる",
  "plate_number": "自動車登録番号 = ナンバー (例: 川口 300 ち 6175 のように地名+分類番号+ひらがな+一連番号、空白区切り)",
  "inspection_expires_on": "有効期間の満了する日 (車検満了日) を YYYY-MM-DD で。電子車検証や読み取れない場合は null。例: 令和8年4月26日 → 2026-04-26",
  "first_registration_ym": "初度登録年月 を YYYY-MM で。例: 令和6年4月 → 2024-04",
  "registration_date": "登録年月日 または 交付年月日 を YYYY-MM-DD で。これは「この車検証が発行された日」であり、所有移転時に更新される。例: 令和6年4月26日 → 2024-04-26",
  "vin": "車台番号 (例: AXUH85-0035592)",
  "usage": "用途。自家用乗用 → 'private_passenger', 自家用貨物 → 'private_cargo', 事業用 → 'commercial', 不明 → null",
  "is_electronic_cert": "A6サイズの電子車検証だと判断したら true、A4の旧車検証なら false",
  "notes": "抽出時に気になった点があれば一言。電子車検証だった場合や日付の整合性に違和感があった場合は必ずここに記載。なければ null"
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
    registration_date: nonEmpty(parsed.registration_date),
    vin: nonEmpty(parsed.vin),
    usage: parseUsage(parsed.usage),
    is_electronic_cert: parsed.is_electronic_cert === true,
    notes: nonEmpty(parsed.notes),
  }
}

function nonEmpty(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (!t || t.toLowerCase() === 'null') return null
  return t
}

function parseUsage(v: unknown): CertOcrResult['usage'] {
  if (v === 'private_passenger' || v === 'private_cargo' || v === 'commercial') {
    return v
  }
  return null
}
