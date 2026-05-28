-- Stripe サブスクリプション (Phase D)
-- 店舗ごとの課金状態を保持。
-- plan: 'trial' (デフォルト) / 'standard' / 'pro' / 'past_due' / 'canceled'

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT, -- Stripe の status をそのまま (active/trialing/past_due/canceled等)
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');

COMMENT ON COLUMN shops.stripe_customer_id IS 'Stripe Customer ID (cus_xxx)';
COMMENT ON COLUMN shops.stripe_subscription_id IS 'Stripe Subscription ID (sub_xxx)';
COMMENT ON COLUMN shops.subscription_status IS 'Stripe status: trialing/active/past_due/canceled/incomplete';
COMMENT ON COLUMN shops.current_period_end IS '現在の課金期間の終了日時';
COMMENT ON COLUMN shops.trial_ends_at IS '新規登録から30日間は無料トライアル';
