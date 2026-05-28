import { getOrGenerateMaintenanceAdvice } from '@/lib/maintenance-advisor-cache'
import type { Vehicle, MaintenanceRecord } from '@/lib/types'
import { MaintenanceRecommendationsCustomer } from './maintenance-recommendations-customer'
import { MaintenanceRecommendationsShop } from './maintenance-recommendations-shop'

/**
 * Suspense でラップ可能な非同期 Server Component。
 * AI 呼び出しでページのロード全体を遅延させたくないため、
 * 呼び出し側で <Suspense fallback={...}> でラップする。
 */

export async function MaintenanceRecommendationsCustomerAsync({
  vehicle,
  records,
  shopPhone,
}: {
  vehicle: Vehicle
  records: MaintenanceRecord[]
  shopPhone: string | null
}) {
  try {
    const advice = await getOrGenerateMaintenanceAdvice(vehicle, records)
    return (
      <MaintenanceRecommendationsCustomer
        advice={advice}
        shopPhone={shopPhone}
      />
    )
  } catch (e) {
    console.error('AI整備提案生成失敗 (customer):', e)
    return null // エラー時は静かに非表示 (お客様には見せない)
  }
}

export async function MaintenanceRecommendationsShopAsync({
  vehicle,
  records,
  customerName,
}: {
  vehicle: Vehicle
  records: MaintenanceRecord[]
  customerName: string
}) {
  try {
    const advice = await getOrGenerateMaintenanceAdvice(vehicle, records)
    return (
      <MaintenanceRecommendationsShop
        advice={advice}
        customerName={customerName}
      />
    )
  } catch (e) {
    console.error('AI整備提案生成失敗 (shop):', e)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        AI整備提案の生成に失敗しました。ANTHROPIC_API_KEY を確認してください。
      </div>
    )
  }
}
