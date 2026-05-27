-- =============================================================
-- Phase 7.8: ツーリング記録 (一緒に旅した思い出)
-- 作成日: 2026-05-27
-- =============================================================

create table if not exists public.touring_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  touring_date date not null,
  title text not null,
  place_name text,
  address text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  photo_url text,
  memo text,
  created_by text not null default 'customer'
    check (created_by in ('shop', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_touring_records_vehicle_id
  on public.touring_records(vehicle_id);
create index if not exists idx_touring_records_date
  on public.touring_records(touring_date desc);

alter table public.touring_records enable row level security;

create policy "touring_records_owner_all"
  on public.touring_records for all
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

create trigger touring_records_updated_at
  before update on public.touring_records
  for each row execute function public.handle_updated_at();

-- ツーリング写真用Storageバケット
insert into storage.buckets (id, name, public)
values ('touring-photos', 'touring-photos', true)
on conflict (id) do nothing;

drop policy if exists "touring_photos_public_read" on storage.objects;
create policy "touring_photos_public_read"
  on storage.objects for select using (bucket_id = 'touring-photos');

drop policy if exists "touring_photos_insert" on storage.objects;
create policy "touring_photos_insert"
  on storage.objects for insert
  with check (bucket_id = 'touring-photos');

drop policy if exists "touring_photos_update" on storage.objects;
create policy "touring_photos_update"
  on storage.objects for update using (bucket_id = 'touring-photos');

drop policy if exists "touring_photos_delete" on storage.objects;
create policy "touring_photos_delete"
  on storage.objects for delete using (bucket_id = 'touring-photos');
