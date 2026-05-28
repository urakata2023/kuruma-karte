import 'server-only'
import Stripe from 'stripe'

let _client: Stripe | null = null

/**
 * Stripe クライアント (Phase D)
 * STRIPE_SECRET_KEY が未設定だと throw する
 */
export function getStripe(): Stripe {
  if (!_client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error(
        'STRIPE_SECRET_KEY is not set. Add it to .env.local and Vercel env.'
      )
    }
    // apiVersion は SDK 同梱のデフォルトを使う (SDK バージョンで型がブレるため)
    _client = new Stripe(key)
  }
  return _client
}

/**
 * プラン定義 (Phase D)
 * Stripe Dashboard で同じ Price ID を作成し、環境変数にセットする。
 *
 * 価格設計 (くるまカルテ-05-事業計画 から):
 * - スタンダード: 月額 4,980円 / 顧客数200名まで
 * - プロ: 月額 9,800円 / 無制限 + LINE/Stripe連携
 */
export const PLANS = {
  standard: {
    label: 'スタンダード',
    price_jpy: 4980,
    customer_limit: 200,
    features: [
      'お客様マイページ',
      '車検自動通知 (メール)',
      '整備記録・写真',
      '入庫予約',
      'AI整備提案',
      'テーマカラー',
    ],
    stripe_price_id: process.env.STRIPE_PRICE_ID_STANDARD ?? null,
  },
  pro: {
    label: 'プロ',
    price_jpy: 9800,
    customer_limit: null,
    features: [
      'スタンダード機能すべて',
      '顧客数無制限',
      'LINE / Liny 連携',
      'マルチスタッフ (3名まで)',
      'スタッフ無制限 (今後)',
      '優先サポート',
    ],
    stripe_price_id: process.env.STRIPE_PRICE_ID_PRO ?? null,
  },
} as const

export type PlanId = keyof typeof PLANS

/**
 * Stripe Checkout セッションを作る
 */
export async function createCheckoutSession(params: {
  shopId: string
  shopName: string
  customerEmail: string
  plan: PlanId
  successUrl: string
  cancelUrl: string
  existingStripeCustomerId?: string | null
}): Promise<string> {
  const stripe = getStripe()
  const planDef = PLANS[params.plan]
  if (!planDef.stripe_price_id) {
    throw new Error(
      `${params.plan} の STRIPE_PRICE_ID 環境変数が未設定です`
    )
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: params.existingStripeCustomerId ?? undefined,
    customer_email: params.existingStripeCustomerId
      ? undefined
      : params.customerEmail,
    line_items: [{ price: planDef.stripe_price_id, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      shop_id: params.shopId,
      shop_name: params.shopName,
      plan: params.plan,
    },
    subscription_data: {
      metadata: {
        shop_id: params.shopId,
        plan: params.plan,
      },
    },
  })

  if (!session.url) throw new Error('Checkout セッションURLが取得できません')
  return session.url
}

/**
 * Customer Portal セッション作成 (請求書ダウンロード、解約、カード変更)
 */
export async function createPortalSession(params: {
  stripeCustomerId: string
  returnUrl: string
}): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl,
  })
  return session.url
}
