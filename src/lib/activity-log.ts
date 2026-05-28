import 'server-only'
import { createAdminClient } from './supabase/admin'

/**
 * 活動履歴ロギングヘルパー (Phase I)
 *
 * 操作・通知送信の全てをここに記録。
 * - エラーが起きてもメイン処理は止めない (try/catch で握りつぶす)
 * - shop_id 必須、user_id 任意
 */

export type ActivityKind =
  // 予約系
  | 'reservation_requested'
  | 'reservation_confirmed'
  | 'reservation_proposed'
  | 'reservation_rejected'
  | 'reservation_completed'
  | 'reservation_accepted_by_customer'
  // 整備系
  | 'maintenance_added'
  | 'maintenance_updated'
  | 'maintenance_deleted'
  // 顧客・車両
  | 'customer_added'
  | 'customer_updated'
  | 'vehicle_added'
  | 'vehicle_updated'
  // 通知 (チャネル別ステータス)
  | 'notification_sent'
  // AI
  | 'ai_advice_generated'
  // 設定
  | 'theme_changed'
  | 'integrations_updated'

export type LogActivityParams = {
  shop_id: string
  user_id?: string | null
  kind: ActivityKind
  target_type?:
    | 'reservation'
    | 'vehicle'
    | 'customer'
    | 'maintenance_record'
    | 'shop'
    | null
  target_id?: string | null
  message: string
  metadata?: Record<string, unknown>
  channel?: 'email' | 'line' | 'sms' | null
  channel_status?: 'sent' | 'failed' | 'skipped' | null
  channel_recipient?: string | null
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('activity_logs').insert({
      shop_id: params.shop_id,
      user_id: params.user_id ?? null,
      kind: params.kind,
      target_type: params.target_type ?? null,
      target_id: params.target_id ?? null,
      message: params.message,
      metadata: params.metadata ?? null,
      channel: params.channel ?? null,
      channel_status: params.channel_status ?? null,
      channel_recipient: params.channel_recipient ?? null,
    })
  } catch (e) {
    // ログ書き込み失敗はメイン処理を止めない
    console.error('[logActivity] failed:', e)
  }
}
