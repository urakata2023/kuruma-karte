-- 整備記録に Before/After 写真を追加 (Phase A)
-- 整備履歴の信頼性アップ。お客様に「ちゃんとやった」が伝わる。

ALTER TABLE maintenance_records
ADD COLUMN IF NOT EXISTS before_photo_url TEXT,
ADD COLUMN IF NOT EXISTS after_photo_url TEXT;

COMMENT ON COLUMN maintenance_records.before_photo_url IS '整備前の写真URL (Storage bucket: vehicle-photos)';
COMMENT ON COLUMN maintenance_records.after_photo_url IS '整備後の写真URL (Storage bucket: vehicle-photos)';
