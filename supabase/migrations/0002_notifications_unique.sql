-- =============================================================
-- Phase 2: 自動通知バッチ用のインデックス
-- 作成日: 2026-05-27
-- 目的: 同じ車両に同じ種別の通知を同日に二重送信しないようにする
-- =============================================================

-- 二重送信防止のためのユニーク制約
-- (vehicle_id, kind, scheduled_on) の組み合わせは一度だけ
create unique index if not exists notifications_unique_per_send
  on public.notifications(vehicle_id, kind, scheduled_on);

-- 通知履歴の表示・検索高速化（顧客詳細ページで使う）
create index if not exists idx_notifications_scheduled_on_desc
  on public.notifications(scheduled_on desc);

-- 送信ステータスごとの集計用
create index if not exists idx_notifications_status_kind
  on public.notifications(status, kind);
