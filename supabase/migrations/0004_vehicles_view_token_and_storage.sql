-- =============================================================
-- Phase 4: オーナーマイページ + 写真アップロード
-- 作成日: 2026-05-27
-- =============================================================

-- 1. 車両ごとの公開閲覧トークン（推測困難なUUID）
alter table public.vehicles
  add column if not exists view_token uuid not null default gen_random_uuid();

create unique index if not exists idx_vehicles_view_token
  on public.vehicles(view_token);

-- 2. Storage バケット：vehicle-photos（公開読み取り）
insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do nothing;

-- 3. Storage RLS ポリシー
-- 誰でも公開URLで写真を読める（マイページが公開なので必要）
drop policy if exists "vehicle_photos_public_read" on storage.objects;
create policy "vehicle_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'vehicle-photos');

-- 認証済みユーザー（=車屋）だけがアップロード可能
drop policy if exists "vehicle_photos_authenticated_insert" on storage.objects;
create policy "vehicle_photos_authenticated_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'vehicle-photos'
    and auth.uid() is not null
  );

-- 認証済みユーザーだけが更新可能
drop policy if exists "vehicle_photos_authenticated_update" on storage.objects;
create policy "vehicle_photos_authenticated_update"
  on storage.objects for update
  using (
    bucket_id = 'vehicle-photos'
    and auth.uid() is not null
  );

-- 認証済みユーザーだけが削除可能
drop policy if exists "vehicle_photos_authenticated_delete" on storage.objects;
create policy "vehicle_photos_authenticated_delete"
  on storage.objects for delete
  using (
    bucket_id = 'vehicle-photos'
    and auth.uid() is not null
  );
