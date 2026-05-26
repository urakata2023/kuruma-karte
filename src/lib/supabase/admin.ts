import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * service_role キーを使う管理クライアント
 *
 * RLSをバイパスするので、auth.uid()がない場面でのみ使う：
 * - Cron バッチ（/api/cron/notifications）
 * - 公開エンドポイント（/r/[token] の顧客自身による登録）
 *
 * 通常のページ・Server Action では server.ts の createClient を使うこと。
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY
  if (!key) throw new Error('SUPABASE_SECRET_KEY is not set')

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false } }
  )
}
