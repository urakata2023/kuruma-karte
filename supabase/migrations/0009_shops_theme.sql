-- 店舗テーマ機能 (Phase 10)
-- shops に theme カラムを追加。マイページ・管理画面のカラーリングに反映。
-- 既存レコードは 'default' (Karte Default テーマ) で運用継続。

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'default';

-- 想定値: 'default', 'rosso', 'heritage-gold', 'bavarian-blue', 'premium-black', 'silver-star'
-- ALTER で CHECK 制約は付けない (将来テーマを足したい時に migration なしで足せるように)
COMMENT ON COLUMN shops.theme IS 'UIテーマ識別子。client側で許可リスト検証。';
