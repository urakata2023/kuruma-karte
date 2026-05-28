-- 顧客タグ機能 (Phase L - C)
-- 「VIP」「要フォロー」「休眠」など、顧客戦略の可視化用ラベル

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

COMMENT ON COLUMN customers.tags IS '顧客タグ配列。よく使う: vip, follow_up, dormant, new, regular, careful';

CREATE INDEX IF NOT EXISTS idx_customers_tags ON customers USING GIN(tags);
