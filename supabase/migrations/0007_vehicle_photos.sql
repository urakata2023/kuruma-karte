-- =============================================================
-- Phase 7: 愛車の複数枚ギャラリー写真
-- 作成日: 2026-05-27
-- =============================================================

create table if not exists public.vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  photo_url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_vehicle_photos_vehicle_id
  on public.vehicle_photos(vehicle_id);
create index if not exists idx_vehicle_photos_sort
  on public.vehicle_photos(vehicle_id, sort_order, created_at);

alter table public.vehicle_photos enable row level security;

-- 車屋オーナーのみ自店のギャラリー写真を操作可
create policy "vehicle_photos_owner_all"
  on public.vehicle_photos for all
  using (
    shop_id in (
      select id from public.shops where owner_user_id = auth.uid()
    )
  )
  with check (
    shop_id in (
      select id from public.shops where owner_user_id = auth.uid()
    )
  );

-- お客様マイページの閲覧は service_role 経由なのでRLSを通らない
-- = view_token で取得する流れは admin client を使うため公開読み取り扱い
