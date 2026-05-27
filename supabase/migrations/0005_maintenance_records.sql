-- =============================================================
-- Phase 5: 整備記録 (maintenance_records)
-- 作成日: 2026-05-27
-- =============================================================

create table if not exists public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  performed_on date not null,
  mileage_km integer,            -- 整備時の走行距離
  title text not null,           -- 「車検」「定期点検」「オイル交換」など
  description text,              -- 整備内容の詳細メモ
  parts text,                    -- 交換した部品（フリーテキスト・将来構造化）
  cost integer,                  -- 費用（円）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_maintenance_records_vehicle_id
  on public.maintenance_records(vehicle_id);
create index if not exists idx_maintenance_records_performed_on
  on public.maintenance_records(performed_on desc);

alter table public.maintenance_records enable row level security;

create policy "maintenance_records_owner_all"
  on public.maintenance_records for all
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

create trigger maintenance_records_updated_at
  before update on public.maintenance_records
  for each row execute function public.handle_updated_at();
