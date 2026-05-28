-- 活動履歴 (Phase I)
-- 店舗の全操作・通知送信を記録。「あれ、連絡したっけ?」を解消する根本機能。

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 操作したスタッフ (任意)
  kind TEXT NOT NULL, -- 'reservation_confirmed', 'reservation_proposed', 'notification_sent' 等
  target_type TEXT, -- 'reservation' / 'vehicle' / 'customer' / 'maintenance_record' 等
  target_id UUID, -- 関連レコードのID
  message TEXT NOT NULL, -- 表示用 (例: "佐藤様の予約を5/30で確定")
  metadata JSONB, -- 任意の追加情報
  channel TEXT, -- 'email' / 'line' / 'sms' / null
  channel_status TEXT, -- 'sent' / 'failed' / 'skipped' / null
  channel_recipient TEXT, -- 送信先 (メアド or LINE userId)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_shop ON activity_logs(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_target ON activity_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_kind ON activity_logs(shop_id, kind);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_read_own_shop_activity" ON activity_logs;
CREATE POLICY "members_read_own_shop_activity"
  ON activity_logs FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM shop_members WHERE user_id = auth.uid()
    )
  );
