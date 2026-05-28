-- LINE/Liny 連携設定 (Phase C)
-- 店舗ごとに LINE 公式 + Liny の APIキーを保管。
-- 通知バッチ・予約申し込み時の店主通知などで使う。

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS line_channel_access_token TEXT,
ADD COLUMN IF NOT EXISTS line_owner_user_id TEXT, -- 店主の LINE userId (通知先)
ADD COLUMN IF NOT EXISTS liny_api_key TEXT,
ADD COLUMN IF NOT EXISTS liny_workspace_id TEXT;

COMMENT ON COLUMN shops.line_channel_access_token IS 'LINE Messaging API のチャネルアクセストークン。店主が設定画面で入力';
COMMENT ON COLUMN shops.line_owner_user_id IS '店主自身の LINE userId。新規予約通知をここに Push する';
COMMENT ON COLUMN shops.liny_api_key IS 'Liny Open API キー (Liny を使う店舗のみ)';
COMMENT ON COLUMN shops.liny_workspace_id IS 'Liny ワークスペースID';

-- 顧客テーブルにも LINE userId 連携用 (既に line_user_id カラムが存在する想定だが念のため確認)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS line_display_name TEXT;
