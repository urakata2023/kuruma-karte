-- =============================================================
-- くるまカルテ MVP 初期スキーマ（Phase 0）
-- 作成日: 2026-05-27
-- 4テーブル: shops / customers / vehicles / notifications
-- RLS: shop owner だけ自店のデータを操作できる
-- =============================================================

-- ─────────────────────────────────────────────
-- shops（車屋）
-- ─────────────────────────────────────────────
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  plan text not null default 'trial'
    check (plan in ('trial', 'standard', 'pro')),
  stripe_customer_id text,
  line_channel_token text,  -- LINE Messaging APIトークン。将来は暗号化推奨
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id)
);

-- ─────────────────────────────────────────────
-- customers（顧客 = 車のオーナー）
-- ─────────────────────────────────────────────
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  line_user_id text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- vehicles（車）
-- ─────────────────────────────────────────────
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  model text,                  -- 車種
  plate_number text,           -- ナンバー
  first_registration_ym text,  -- 初度登録年月 (YYYY-MM)
  inspection_expires_on date,  -- ★コア：車検満了日
  purchased_on date,           -- 購入日
  last_oil_change_on date,     -- 前回オイル交換日
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- notifications（通知）
-- ─────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  kind text not null
    check (kind in ('inspection', 'oil_change', 'general')),
  scheduled_on date not null,
  sent_at timestamptz,
  channel text check (channel in ('mail', 'line')),
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'cancelled')),
  message text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- インデックス
-- ─────────────────────────────────────────────
create index idx_customers_shop_id on public.customers(shop_id);
create index idx_vehicles_shop_id on public.vehicles(shop_id);
create index idx_vehicles_customer_id on public.vehicles(customer_id);
create index idx_vehicles_inspection_expires_on
  on public.vehicles(inspection_expires_on);
create index idx_notifications_vehicle_id
  on public.notifications(vehicle_id);
create index idx_notifications_scheduled_on
  on public.notifications(scheduled_on);
create index idx_notifications_status
  on public.notifications(status);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table public.shops enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.notifications enable row level security;

-- shops: owner だけが自店を select/insert/update できる
create policy "shops_owner_select"
  on public.shops for select
  using (owner_user_id = auth.uid());

create policy "shops_owner_insert"
  on public.shops for insert
  with check (owner_user_id = auth.uid());

create policy "shops_owner_update"
  on public.shops for update
  using (owner_user_id = auth.uid());

-- customers: 自店の顧客だけ
create policy "customers_owner_all"
  on public.customers for all
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

-- vehicles: 自店の車だけ
create policy "vehicles_owner_all"
  on public.vehicles for all
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

-- notifications: 自店の車の通知だけ
create policy "notifications_owner_select"
  on public.notifications for select
  using (
    vehicle_id in (
      select v.id from public.vehicles v
      join public.shops s on s.id = v.shop_id
      where s.owner_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- updated_at 自動更新トリガー
-- ─────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger shops_updated_at before update on public.shops
  for each row execute function public.handle_updated_at();
create trigger customers_updated_at before update on public.customers
  for each row execute function public.handle_updated_at();
create trigger vehicles_updated_at before update on public.vehicles
  for each row execute function public.handle_updated_at();
