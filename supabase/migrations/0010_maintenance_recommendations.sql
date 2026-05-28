-- AI整備提案のキャッシュ (Phase 11)
-- Claude API 呼び出しは 1回 5円程度。毎回呼ぶのは無駄なので、
-- 車両毎に最新の提案結果を保存し、整備記録が更新されたら再生成する。

CREATE TABLE IF NOT EXISTS maintenance_recommendations (
  vehicle_id UUID PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  -- 提案結果の本体 (JSON)
  payload JSONB NOT NULL,
  -- 何件のレコードを元に生成したか (再生成判定用)
  source_record_count INTEGER NOT NULL DEFAULT 0,
  -- 生成日時
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maint_reco_shop ON maintenance_recommendations(shop_id);

-- RLS: 管理画面は普通の認証経由でアクセス、マイページは admin client 経由 (token 検証はアプリ側)
ALTER TABLE maintenance_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_owner_can_read_own_recommendations"
  ON maintenance_recommendations FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "shop_owner_can_write_own_recommendations"
  ON maintenance_recommendations FOR ALL
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE owner_user_id = auth.uid()
    )
  );
