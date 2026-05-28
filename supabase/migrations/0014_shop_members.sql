-- マルチスタッフ対応 (Phase F)
-- 1店舗を複数ユーザーで運用できるように。
-- - owner: 店長 (店舗作成者、課金責任者)
-- - staff: 整備士・事務員 (整備記録の追加・編集はできるが課金/メンバー管理不可)
--
-- 既存 shops.owner_user_id は維持しつつ、shop_members で多対多の権限を表現。
-- getCurrentShop() を shop_members 経由に切り替え、shops.owner_user_id 自体は
-- 「店舗の代表ユーザー」マーカーとして残す。

CREATE TABLE IF NOT EXISTS shop_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  display_name TEXT, -- 「整備士 田中」など (任意)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shop_members_user ON shop_members(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_members_shop ON shop_members(shop_id);

-- 既存の shops.owner_user_id から owner メンバーを自動補完
INSERT INTO shop_members (shop_id, user_id, role)
SELECT id, owner_user_id, 'owner'
FROM shops
WHERE owner_user_id IS NOT NULL
ON CONFLICT (shop_id, user_id) DO NOTHING;

-- RLS
ALTER TABLE shop_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_can_see_own_shop_members" ON shop_members;
CREATE POLICY "members_can_see_own_shop_members"
  ON shop_members FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM shop_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "owner_can_write_shop_members" ON shop_members;
CREATE POLICY "owner_can_write_shop_members"
  ON shop_members FOR ALL
  USING (
    shop_id IN (
      SELECT shop_id FROM shop_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM shop_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- 招待コードテーブル (URL経由でスタッフを招待する用)
CREATE TABLE IF NOT EXISTS shop_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  invitation_code TEXT NOT NULL UNIQUE, -- ランダムなトークン
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_invitations_code ON shop_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_shop_invitations_shop ON shop_invitations(shop_id);

ALTER TABLE shop_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_manages_invitations" ON shop_invitations;
CREATE POLICY "owner_manages_invitations"
  ON shop_invitations FOR ALL
  USING (
    shop_id IN (
      SELECT shop_id FROM shop_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM shop_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
