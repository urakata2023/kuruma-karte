import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { MaintenanceTimeline } from '@/components/maintenance-timeline'
import { MileageChart } from '@/components/mileage-chart'
import { VehicleGallery } from '@/components/vehicle-gallery'
import { ShareButton } from '@/components/share-button'
import { AlwaysWithYou } from '@/components/always-with-you'
import { OwnerHeroPhoto } from '@/components/owner-hero-photo'
import { PlateDisplay } from '@/components/plate-display'
import { TouringList } from '@/components/touring-list'
import { CollapsibleMap } from '@/components/collapsible-map'
import { ToastBanner } from '@/components/toast-banner'
import { OnboardingTour } from '@/components/onboarding-tour'
import { MaintenanceRecommendationsCustomerAsync } from '@/components/maintenance-recommendations-async'
import { Suspense } from 'react'
import {
  calcMonthlyAverageKm,
  extractMileagePoints,
  fmtNum,
} from '@/lib/vehicle-stats'
import type {
  Vehicle,
  MaintenanceRecord,
  VehiclePhoto,
  TouringRecord,
} from '@/lib/types'

type CustomerLite = { name: string }
type ShopLite = { name: string; phone: string | null }

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const admin = createAdminClient()
  const { data: vehicle } = await admin
    .from('vehicles')
    .select('model, plate_number, customer_id, shop_id')
    .eq('view_token', token)
    .maybeSingle()
  if (!vehicle) return { title: 'くるまカルテ' }

  const [customerR, shopR] = await Promise.all([
    admin
      .from('customers')
      .select('name')
      .eq('id', vehicle.customer_id)
      .maybeSingle<CustomerLite>(),
    admin
      .from('shops')
      .select('name')
      .eq('id', vehicle.shop_id)
      .maybeSingle<ShopLite>(),
  ])

  const title = `${customerR.data?.name ?? 'お客様'} さんの ${vehicle.model ?? 'お車'}`
  const description = `${shopR.data?.name ?? '車屋'}に登録された愛車のマイページ。車検・整備の記録をいつでも手元に。`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function OwnerMyPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ toast?: string; msg?: string }>
}) {
  const { token } = await params
  const { toast, msg } = await searchParams
  const admin = createAdminClient()

  const { data: vehicle } = await admin
    .from('vehicles')
    .select('*')
    .eq('view_token', token)
    .maybeSingle<Vehicle>()

  if (!vehicle) notFound()

  const [
    { data: customer },
    { data: shop },
    { data: recordsData },
    { data: photosData },
    { data: touringData },
  ] = await Promise.all([
    admin
      .from('customers')
      .select('name')
      .eq('id', vehicle.customer_id)
      .maybeSingle<CustomerLite>(),
    admin
      .from('shops')
      .select('name, phone')
      .eq('id', vehicle.shop_id)
      .maybeSingle<ShopLite>(),
    admin
      .from('maintenance_records')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('performed_on', { ascending: false })
      .order('created_at', { ascending: false }),
    admin
      .from('vehicle_photos')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    admin
      .from('touring_records')
      .select('*')
      .eq('vehicle_id', vehicle.id)
      .order('touring_date', { ascending: false }),
  ])

  const records = (recordsData ?? []) as MaintenanceRecord[]
  const photos = (photosData ?? []) as VehiclePhoto[]
  const tourings = (touringData ?? []) as TouringRecord[]

  // 統計
  const mileagePoints = extractMileagePoints(records)
  const latestMileage =
    mileagePoints.length > 0
      ? mileagePoints[mileagePoints.length - 1].km
      : null
  const monthlyAverageKm = calcMonthlyAverageKm(mileagePoints)

  const startIso: string | null = vehicle.purchased_on
    ? `${vehicle.purchased_on}T00:00:00`
    : vehicle.first_registration_ym
      ? `${vehicle.first_registration_ym}-01T00:00:00`
      : null

  const daysToInspection = vehicle.inspection_expires_on
    ? daysUntil(vehicle.inspection_expires_on)
    : null

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://kuruma-karte.vercel.app'
  const shareUrl = `${appUrl}/my/${token}`
  const shareTitle = `${customer?.name ?? 'わたし'} の ${vehicle.model ?? '愛車'}`

  return (
    <div className="flex flex-1 flex-col">
      {/* オンボーディングツアー (初回 or ?welcome=1 で出現) */}
      <OnboardingTour />

      {/* Server Action 経由の結果バナー */}
      {(toast === 'ok' || toast === 'err') && msg && (
        <ToastBanner type={toast} message={msg} />
      )}

      {/* ヘッダー */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">{shop?.name ?? '車屋'}</p>
            <p className="text-base font-semibold">
              {customer?.name ?? 'お客様'} 様
            </p>
          </div>
          <ShareButton
            url={shareUrl}
            title={shareTitle}
            text={`${shareTitle}のマイページ`}
          />
        </div>
      </header>

      {/* ヒーロー：愛車写真（未登録ならタップで追加） */}
      <section className="relative bg-gradient-to-br from-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-950">
        <div className="mx-auto max-w-2xl px-6 py-12">
          <OwnerHeroPhoto
            token={token}
            currentUrl={vehicle.photo_url}
            alt={vehicle.model ?? '愛車'}
          />
          <div className="mt-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {vehicle.model ?? 'お車'}
            </h1>
            {vehicle.plate_number && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                <PlateDisplay plate={vehicle.plate_number} />
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ALWAYS WITH YOU カウンター */}
      {startIso && <AlwaysWithYou startIso={startIso} />}

      {/* AIからの「次のおすすめ整備」 — Phase 11 */}
      <Suspense
        fallback={
          <section className="mx-auto w-full max-w-2xl px-6 py-8">
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-4 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
              💡 AIが愛車に合うおすすめ整備を考えています…
            </div>
          </section>
        }
      >
        <MaintenanceRecommendationsCustomerAsync
          vehicle={vehicle}
          records={records}
          shopPhone={shop?.phone ?? null}
        />
      </Suspense>

      {/* ギャラリー */}
      <VehicleGallery photos={photos} heroPhotoUrl={vehicle.photo_url} />

      {/* 統計カード */}
      <section className="mx-auto w-full max-w-2xl px-6 pt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {daysToInspection !== null && (
            <StatCard
              label="次回車検まで"
              value={
                daysToInspection < 0
                  ? `${Math.abs(daysToInspection)}日`
                  : `あと${daysToInspection}日`
              }
              tone={
                daysToInspection < 0
                  ? 'danger'
                  : daysToInspection <= 90
                  ? 'warn'
                  : 'normal'
              }
            />
          )}
          {latestMileage != null && (
            <StatCard
              label="最新走行距離"
              value={`${fmtNum(latestMileage)} km`}
            />
          )}
          {monthlyAverageKm != null && (
            <StatCard
              label="月平均走行"
              value={`${fmtNum(monthlyAverageKm)} km`}
            />
          )}
        </div>
      </section>

      {/* 走行距離グラフ */}
      {mileagePoints.length >= 2 && (
        <section className="mx-auto w-full max-w-2xl px-6 pt-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
            <h2 className="mb-3 text-base font-semibold">走行距離の推移</h2>
            <MileageChart points={mileagePoints} />
            <p className="mt-2 text-xs text-zinc-500">
              整備記録に登録された走行距離をもとに表示しています
            </p>
          </div>
        </section>
      )}

      {/* 車両情報 */}
      <section className="mx-auto w-full max-w-2xl px-6 py-6">
        <h2 className="mb-4 text-base font-semibold">お車の記録</h2>
        <div className="grid grid-cols-2 gap-3">
          <Info label="初度登録" value={vehicle.first_registration_ym ?? '—'} />
          <Info
            label="購入日"
            value={
              vehicle.purchased_on ? formatDateJP(vehicle.purchased_on) : '—'
            }
          />
          <Info
            label="前回オイル交換"
            value={
              vehicle.last_oil_change_on
                ? formatDateJP(vehicle.last_oil_change_on)
                : '—'
            }
          />
          <Info
            label="車検満了日"
            value={
              vehicle.inspection_expires_on
                ? formatDateJP(vehicle.inspection_expires_on)
                : '—'
            }
          />
        </div>
      </section>

      {/* 🛣️ ツーリング記録 */}
      <section className="mx-auto w-full max-w-2xl space-y-4 px-6 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">🛣️ 一緒に旅した記録</h2>
          <Link
            href={`/my/${token}/touring/new`}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            ＋ ツーリングを記録
          </Link>
        </div>

        {/* マップ表示 or 案内 */}
        {tourings.length > 0 &&
        tourings.some((t) => t.latitude != null && t.longitude != null) ? (
          <CollapsibleMap records={tourings} />
        ) : tourings.length > 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-5 text-center text-sm text-zinc-500 dark:border-zinc-700">
            🗺️ 地図ピンを表示するには、各記録に住所か場所の名前が必要です。
            <br />
            <span className="text-xs">
              下のカードの「📍 この場所をマップに追加」を押すと、住所から座標を自動取得します。
              <br />
              ※ 新規記録は保存時に自動で地図に追加されます。
            </span>
          </div>
        ) : null}

        <TouringList records={tourings} token={token} />
      </section>

      {/* 整備履歴タイムライン */}
      <section className="mx-auto w-full max-w-2xl px-6 pb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">整備・メモの記録</h2>
          <Link
            href={`/my/${token}/maintenance/new`}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            ＋ 自分でメモを追加
          </Link>
        </div>
        <MaintenanceTimeline records={records} token={token} />
      </section>

      {/* お店情報 */}
      <section className="mx-auto w-full max-w-2xl px-6 pb-10">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
          <p className="text-xs text-zinc-500">いつもの車屋さん</p>
          <p className="mt-1 text-lg font-semibold">{shop?.name ?? '—'}</p>
          {shop?.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="mt-2 inline-block text-sm text-zinc-700 underline dark:text-zinc-300"
            >
              {shop.phone}
            </a>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            車検や整備のご相談はお気軽に。
          </p>
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
        Powered by くるまカルテ
      </footer>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone = 'normal',
}: {
  label: string
  value: string
  tone?: 'normal' | 'warn' | 'danger'
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950'
      : tone === 'warn'
      ? 'border-orange-300 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'
      : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black'
  return (
    <div className={`rounded-xl border p-4 text-center ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold sm:text-xl">{value}</p>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-black">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  )
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatDateJP(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${m}月${d}日`
}
