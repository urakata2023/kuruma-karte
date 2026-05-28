-- 入庫予約 (Phase B)
-- お客様マイページから「次の整備予約」を申し込む。店主が承認/拒否/調整。
-- B2B2C 真骨頂: お客様自身がアクションを起こす。

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  -- お客様希望
  desired_date DATE NOT NULL,
  desired_slot TEXT, -- 'morning' / 'afternoon' / 'evening' / 'any'
  purpose TEXT NOT NULL, -- 「車検整備」「オイル交換」など
  customer_note TEXT, -- お客様からのメモ
  -- 店主回答
  confirmed_date DATE, -- 承認時に確定日 (希望日と違ってもOK)
  confirmed_slot TEXT,
  shop_note TEXT, -- 店主からのメモ (返答)
  status TEXT NOT NULL DEFAULT 'requested', -- 'requested' / 'confirmed' / 'rejected' / 'completed' / 'cancelled'
  -- メタ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_shop ON reservations(shop_id, desired_date);
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle ON reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(shop_id, status);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_owner_can_read_reservations" ON reservations;
CREATE POLICY "shop_owner_can_read_reservations"
  ON reservations FOR SELECT
  USING (shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "shop_owner_can_write_reservations" ON reservations;
CREATE POLICY "shop_owner_can_write_reservations"
  ON reservations FOR ALL
  USING (shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid()))
  WITH CHECK (shop_id IN (SELECT id FROM shops WHERE owner_user_id = auth.uid()));
