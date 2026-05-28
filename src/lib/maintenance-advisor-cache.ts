import 'server-only'
import { createAdminClient } from './supabase/admin'
import {
  generateMaintenanceAdvice,
  type MaintenanceAdvice,
} from './maintenance-advisor'
import type { Vehicle, MaintenanceRecord } from './types'

type CachedRow = {
  vehicle_id: string
  shop_id: string
  payload: MaintenanceAdvice
  source_record_count: number
  generated_at: string
}

const STALE_HOURS = 24 * 7 // 1週間で再生成

/**
 * キャッシュ込みで整備提案を取得する。
 * - 整備記録の件数が変わった → 再生成
 * - 生成から1週間以上経過 → 再生成
 * - それ以外 → キャッシュを返す
 */
export async function getOrGenerateMaintenanceAdvice(
  vehicle: Vehicle,
  records: MaintenanceRecord[]
): Promise<MaintenanceAdvice> {
  const admin = createAdminClient()

  const { data: cached } = await admin
    .from('maintenance_recommendations')
    .select('*')
    .eq('vehicle_id', vehicle.id)
    .maybeSingle<CachedRow>()

  const recordCount = records.length
  const cacheAgeHours = cached
    ? (Date.now() - new Date(cached.generated_at).getTime()) / 36e5
    : Infinity

  if (
    cached &&
    cached.source_record_count === recordCount &&
    cacheAgeHours < STALE_HOURS
  ) {
    return cached.payload
  }

  const advice = await generateMaintenanceAdvice(vehicle, records)

  await admin.from('maintenance_recommendations').upsert(
    {
      vehicle_id: vehicle.id,
      shop_id: vehicle.shop_id,
      payload: advice,
      source_record_count: recordCount,
      generated_at: advice.generated_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'vehicle_id' }
  )

  return advice
}

/**
 * キャッシュだけ取得 (生成しない)。表示専用。
 */
export async function getCachedMaintenanceAdvice(
  vehicleId: string
): Promise<MaintenanceAdvice | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('maintenance_recommendations')
    .select('payload')
    .eq('vehicle_id', vehicleId)
    .maybeSingle<{ payload: MaintenanceAdvice }>()
  return data?.payload ?? null
}
