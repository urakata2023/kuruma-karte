-- 3日程キャッチボール予約フロー (Phase G)
-- お客様が3日程提案 → 店主が承認 or 3日程再提案 → お客様再選択。
-- L Messageに依存しない汎用フロー。メールベース通知。

ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS candidate_dates JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS shop_candidate_dates JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS round INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN reservations.candidate_dates IS 'お客様が提示する3日程の候補 (JSONB配列): [{"date":"2026-05-29","slot":"morning"},...]';
COMMENT ON COLUMN reservations.shop_candidate_dates IS '店主が再提案する3日程候補 (NG時に提示)';
COMMENT ON COLUMN reservations.round IS 'やりとりラウンド数。1=初回申請、2=店主再提案、3=お客様再選択';

-- status を拡張: 'pending_shop' (店主の返答待ち) / 'pending_customer' (お客様の再選択待ち) / 'confirmed' / 'rejected' / 'completed' / 'cancelled'
-- 既存の 'requested' は 'pending_shop' に読み替え可能。シードでの後方互換のため CHECK制約は付けず TEXT 自由のまま運用。
