-- =============================================================
-- Phase 3: 公開QR登録フロー用のshop tokenを追加
-- 作成日: 2026-05-27
-- =============================================================

-- 公開登録URL用のtoken（推測困難なUUID）
-- shop作成時に自動生成、再生成は将来実装
alter table public.shops
  add column if not exists registration_token uuid not null default gen_random_uuid();

create unique index if not exists idx_shops_registration_token
  on public.shops(registration_token);
