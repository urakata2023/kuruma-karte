import type { Vehicle, MaintenanceRecord } from './types'

/**
 * 日付文字列から今日までの経過日数
 */
export function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const from = new Date(dateStr)
  from.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = today.getTime() - from.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * 整備記録から走行距離の推移を時系列で抽出
 * mileage_kmが入っているレコードのみ、performed_on昇順
 */
export type MileagePoint = { date: string; km: number }
export function extractMileagePoints(
  records: MaintenanceRecord[]
): MileagePoint[] {
  return records
    .filter((r): r is MaintenanceRecord & { mileage_km: number } => r.mileage_km != null)
    .map((r) => ({ date: r.performed_on, km: r.mileage_km }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * 走行距離の月間平均（複数点が必要）
 */
export function calcMonthlyAverageKm(points: MileagePoint[]): number | null {
  if (points.length < 2) return null
  const first = points[0]
  const last = points[points.length - 1]
  const days =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) /
    (1000 * 60 * 60 * 24)
  if (days <= 0) return null
  const months = days / 30
  return Math.round((last.km - first.km) / months)
}

/**
 * 愛車との時間 = 購入日 → 今日 の日数
 * 購入日がなければ initial_registration → 今日
 */
export function calcOwnershipDays(vehicle: Vehicle): number | null {
  if (vehicle.purchased_on) return daysSince(vehicle.purchased_on)
  if (vehicle.first_registration_ym) {
    return daysSince(`${vehicle.first_registration_ym}-01`)
  }
  return null
}

/**
 * 数値カウントアップ表示用の桁分け数字
 */
export function fmtNum(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString()
}
