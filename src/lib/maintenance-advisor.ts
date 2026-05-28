import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import type { Vehicle, MaintenanceRecord } from './types'

/**
 * 整備提案エンジン (Phase 11) — 「町工場のAI整備士」
 *
 * 車種・走行距離・整備履歴・経過時間 から、Claude (Sonnet 4.5) が
 * 「次にやるべき整備 TOP3」を優先度付きで提案する。
 *
 * これは CarRide/ブロードリーフが原理的に作れない領域：
 * - 彼らは B2B 効率化ツール文脈なので、エンドユーザー向け提案を提示する設計思想がない
 * - くるまカルテは B2B2C なので「お客様向けのおすすめ」が自然に成立する
 */

export type MaintenanceRecommendation = {
  title: string // "オイル交換"
  reason: string // "前回交換から5,000km・3ヶ月経過しています"
  urgency: 'high' | 'medium' | 'low' // 緊急度
  due_window: string // "今が交換時期" / "来月までに" / "3ヶ月以内"
  icon: string // 絵文字
  estimated_cost_range: string | null // "5,000〜10,000円" など (任意)
  customer_message: string // お客様向けに直接表示する一言
  shop_message: string // 店主向けに使える「電話の話題」用テキスト
}

export type MaintenanceAdvice = {
  recommendations: MaintenanceRecommendation[]
  shop_summary: string // 店主向け短文サマリ
  customer_summary: string // お客様向け短文サマリ
  generated_at: string // ISO timestamp
}

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY is not set')
    _client = new Anthropic({ apiKey: key })
  }
  return _client
}

const SYSTEM_PROMPT = `あなたは日本の自動車整備士として20年以上の経験を持つベテランです。
オーナーさんと整備工場の店主、両方に役立つアドバイスを生成します。

【判断基準】
オイル交換: 5,000km または 6ヶ月、どちらか早い方
オイルフィルター: オイル交換2回に1回
タイヤローテーション: 5,000〜10,000km毎
タイヤ寿命: 3〜5年 または残溝3.2mm以下
ブレーキパッド: 30,000〜50,000km、減りで音が出る前
ブレーキフルード: 2年毎
バッテリー: 2〜5年、寒冷地は短命
エアコンフィルター: 1年または15,000km
ワイパーゴム: 半年〜1年
クーラント (LLC): 2〜4年
法定12ヶ月点検: 毎年 (自家用乗用車)
法定24ヶ月点検 (車検): 期日の3ヶ月前から準備推奨

【季節要因】
- 梅雨前 (5〜6月): エアコン、ワイパー
- 夏前 (6〜7月): エアコン本格チェック、バッテリー
- 冬前 (10〜11月): バッテリー、タイヤ (スタッドレス検討)
- 春先 (3〜4月): 花粉対策でエアコンフィルター

【提案ルール】
1. 整備履歴・走行距離・経過時間・季節を総合判断
2. 緊急度 'high' = いますぐ対応、'medium' = 1〜3ヶ月以内、'low' = 半年以内
3. お客様には不安を煽らず、安心感のある優しい言葉で
4. 店主には実務的に「次の電話で話せる話題」として整理
5. 過剰提案はしない (本当に必要なものだけ)
6. 整備履歴が乏しい場合は推測しすぎず、汎用的な提案にとどめる
7. 推定費用は車種と整備内容から常識的な範囲を estimated_cost_range に。不明なら null。

【出力フォーマット】
必ず以下の JSON のみを出力。コードブロック・説明文は禁止。

{
  "recommendations": [
    {
      "title": "オイル交換",
      "reason": "前回交換から5,300km・3ヶ月経過しています",
      "urgency": "high",
      "due_window": "今月中",
      "icon": "🛢️",
      "estimated_cost_range": "5,000〜8,000円",
      "customer_message": "そろそろオイル交換のタイミングですね。エンジンを長く元気に保つために、お早めの交換をおすすめします。",
      "shop_message": "前回オイル交換から5,300km走行・3ヶ月経過。次回来店時にオイル交換のご提案を。"
    }
  ],
  "shop_summary": "オイル交換が最優先。あわせてタイヤローテーションも提案できます。",
  "customer_summary": "1〜2件、近いうちに点検したい項目があります。お時間あるときにお店までご相談ください。"
}

最大3件まで、本当に必要なものだけ。データが乏しく提案できない場合は recommendations を空配列にして summary に理由を書いてください。`

/**
 * 整備提案を生成する。
 *
 * 戻り値はキャッシュ可能 (24時間程度)。
 * 整備記録が更新されたら生成し直す想定。
 */
export async function generateMaintenanceAdvice(
  vehicle: Vehicle,
  records: MaintenanceRecord[]
): Promise<MaintenanceAdvice> {
  const today = new Date().toISOString().slice(0, 10)

  // 整備履歴を AIに渡しやすい形に整形 (最新30件まで)
  const recordsSummary = records
    .slice(0, 30)
    .map((r) => ({
      date: r.performed_on,
      title: r.title,
      mileage_km: r.mileage_km,
      description: r.description ?? '',
      parts: r.parts ?? '',
    }))

  // 走行距離トレンド (整備記録の mileage_km から推定)
  const mileages = records
    .filter((r) => r.mileage_km != null)
    .map((r) => ({ date: r.performed_on, km: r.mileage_km as number }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const latestMileage = mileages[mileages.length - 1]?.km ?? null
  const monthlyAverageKm =
    mileages.length >= 2
      ? Math.round(
          (mileages[mileages.length - 1].km - mileages[0].km) /
            monthsBetween(mileages[0].date, mileages[mileages.length - 1].date)
        )
      : null

  const inputForAI = {
    today,
    vehicle: {
      model: vehicle.model,
      first_registration_ym: vehicle.first_registration_ym,
      inspection_expires_on: vehicle.inspection_expires_on,
      purchased_on: vehicle.purchased_on,
      last_oil_change_on: vehicle.last_oil_change_on,
    },
    latest_mileage_km: latestMileage,
    monthly_average_km: monthlyAverageKm,
    maintenance_history: recordsSummary,
  }

  const client = getClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `以下の車両情報・整備履歴から、次にやるべき整備を提案してください。

\`\`\`json
${JSON.stringify(inputForAI, null, 2)}
\`\`\`

整備履歴が空でも、車種・初度登録・車検満了日から推測できる範囲で提案してください。`,
      },
    ],
  })

  const textBlock = message.content.find(
    (b): b is Anthropic.TextBlock => b.type === 'text'
  )
  if (!textBlock) throw new Error('AIから空の応答が返りました')

  let jsonStr = textBlock.text.trim()
  jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

  type Parsed = {
    recommendations?: Partial<MaintenanceRecommendation>[]
    shop_summary?: string
    customer_summary?: string
  }
  let parsed: Parsed
  try {
    parsed = JSON.parse(jsonStr) as Parsed
  } catch {
    throw new Error(
      `AI応答をJSONとして解釈できませんでした: ${jsonStr.slice(0, 300)}`
    )
  }

  const recommendations: MaintenanceRecommendation[] = (
    parsed.recommendations ?? []
  ).map((r: Partial<MaintenanceRecommendation>) => ({
    title: r.title ?? '',
    reason: r.reason ?? '',
    urgency: normalizeUrgency(r.urgency),
    due_window: r.due_window ?? '',
    icon: r.icon ?? '🔧',
    estimated_cost_range: r.estimated_cost_range ?? null,
    customer_message: r.customer_message ?? '',
    shop_message: r.shop_message ?? '',
  }))

  return {
    recommendations: recommendations.slice(0, 3),
    shop_summary: parsed.shop_summary ?? '',
    customer_summary: parsed.customer_summary ?? '',
    generated_at: new Date().toISOString(),
  }
}

function normalizeUrgency(v: unknown): MaintenanceRecommendation['urgency'] {
  if (v === 'high' || v === 'medium' || v === 'low') return v
  return 'medium'
}

function monthsBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  const months =
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  return Math.max(1, months)
}
