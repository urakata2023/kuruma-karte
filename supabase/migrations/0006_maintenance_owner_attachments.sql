-- =============================================================
-- Phase 6: お客様の整備メモ + 添付画像（見積もり書など）
-- 作成日: 2026-05-27
-- =============================================================

-- 1. maintenance_records に created_by と attachment_url を追加
alter table public.maintenance_records
  add column if not exists created_by text not null default 'shop'
    check (created_by in ('shop', 'customer')),
  add column if not exists attachment_url text;

-- 2. Storage バケット：maintenance-attachments（公開読み取り）
insert into storage.buckets (id, name, public)
values ('maintenance-attachments', 'maintenance-attachments', true)
on conflict (id) do nothing;

-- 3. Storage RLS：公開読み取り＋認証 or 公開（Server Action経由）でアップロード可
drop policy if exists "maintenance_attachments_public_read" on storage.objects;
create policy "maintenance_attachments_public_read"
  on storage.objects for select
  using (bucket_id = 'maintenance-attachments');

-- お客様側はservice_role経由でアップロードするので、auth.uid() 条件は不要
drop policy if exists "maintenance_attachments_insert" on storage.objects;
create policy "maintenance_attachments_insert"
  on storage.objects for insert
  with check (bucket_id = 'maintenance-attachments');

drop policy if exists "maintenance_attachments_update" on storage.objects;
create policy "maintenance_attachments_update"
  on storage.objects for update
  using (bucket_id = 'maintenance-attachments');

drop policy if exists "maintenance_attachments_delete" on storage.objects;
create policy "maintenance_attachments_delete"
  on storage.objects for delete
  using (bucket_id = 'maintenance-attachments');
