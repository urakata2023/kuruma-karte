import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentShop } from '@/lib/shop'
import { QrDisplay } from '@/components/qr-display'
import { DemoDataPanel } from '@/components/demo-data-panel'
import { TodayTasks } from '@/components/today-tasks'
import { DashboardReservationSummary } from '@/components/dashboard-reservation-summary'
import type { Reservation } from '@/lib/types'

type UpcomingVehicle = {
  id: string
  model: string | null
  plate_number: string | null
  inspection_expires_on: string | null
  customer_id: string
}

type CustomerLite = {
  id: string
  name: string
  phone: string | null
}

export default async function DashboardPage() {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  // 60日後まで (= 「電話タスク」の対象)
  const horizon = new Date(today.getTime() + 60 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10)
  // 過去30日 (= 期限切れも拾う、ぼんやり放置を防ぐ)
  const back30 = new Date(today.getTime() - 30 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10)

  const [customersR, vehiclesR, upcomingR] = await Promise.all([
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shop.id),
    supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shop.id),
    supabase
      .from('vehicles')
      .select('id, model, plate_number, inspection_expires_on, customer_id')
      .eq('shop_id', shop.id)
      .gte('inspection_expires_on', back30)
      .lte('inspection_expires_on', horizon)
      .order('inspection_expires_on', { ascending: true }),
  ])

  const customerCount = customersR.count ?? 0
  const vehicleCount = vehiclesR.count ?? 0
  const upcomingVehicles = (upcomingR.data ?? []) as UpcomingVehicle[]

  // 顧客情報を取得
  const customerMap = new Map<string, CustomerLite>()
  const customerIds = upcomingVehicles.map((v) => v.customer_id)
  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, phone')
      .in('id', customerIds)
    for (const c of (customers ?? []) as CustomerLite[]) {
      customerMap.set(c.id, c)
    }
  }

  // 今日のタスクに変換
  const tasks = upcomingVehicles
    .filter((v) => v.inspection_expires_on)
    .map((v) => {
      const cust = customerMap.get(v.customer_id)
      const daysToExpiry = Math.floor(
        (new Date(v.inspection_expires_on as string).getTime() -
          new Date(todayStr).getTime()) /
          (24 * 3600 * 1000)
      )
      return {
        vehicle_id: v.id,
        customer_id: v.customer_id,
        customer_name: cust?.name ?? '—',
        customer_phone: cust?.phone ?? null,
        model: v.model,
        plate_number: v.plate_number,
        inspection_expires_on: v.inspection_expires_on as string,
        daysToExpiry,
      }
    })

  // 予約サマリ用フェッチ (Phase K)
  const admin = createAdminClient()
  const horizon30 = new Date(today.getTime() + 30 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10)
  const { data: allRes } = await admin
    .from('reservations')
    .select('*')
    .eq('shop_id', shop.id)
    .in('status', ['pending_shop', 'requested', 'pending_customer', 'confirmed'])
    .order('created_at', { ascending: false })
    .limit(50)

  const reservationRows = (allRes ?? []) as Reservation[]

  // 顧客名を取得
  const resCustomerIds = Array.from(
    new Set(reservationRows.map((r) => r.customer_id))
  )
  const resCustMap = new Map<string, string>()
  if (resCustomerIds.length > 0) {
    const { data } = await admin
      .from('customers')
      .select('id, name')
      .in('id', resCustomerIds)
    for (const c of (data ?? []) as { id: string; name: string }[]) {
      resCustMap.set(c.id, c.name)
    }
  }

  const enrich = (rows: Reservation[]) =>
    rows.map((r) => ({
      ...r,
      customer_name: resCustMap.get(r.customer_id) ?? '—',
    }))

  const pendingShop = enrich(
    reservationRows.filter(
      (r) => r.status === 'pending_shop' || r.status === 'requested'
    )
  )
  const pendingCustomer = enrich(
    reservationRows.filter((r) => r.status === 'pending_customer')
  )
  const upcomingConfirmed = enrich(
    reservationRows
      .filter(
        (r) =>
          r.status === 'confirmed' &&
          r.confirmed_date &&
          r.confirmed_date >= todayStr &&
          r.confirmed_date <= horizon30
      )
      .sort((a, b) =>
        (a.confirmed_date ?? '').localeCompare(b.confirmed_date ?? '')
      )
  )

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
      {/* ページタイトル */}
      <header className="space-y-1">
        <p
          className="text-eyebrow"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          Overview
        </p>
        <h1
          className="text-headline"
          style={{ color: 'var(--ink)' }}
        >
          ダッシュボード
        </h1>
        <p
          className="text-sm"
          style={{ color: 'var(--ink-subtle)' }}
        >
          {shop.name} の今日のやること
        </p>
      </header>

      {/* 予約サマリ (最上部・ファーストビュー) */}
      <DashboardReservationSummary
        pendingShop={pendingShop}
        pendingCustomer={pendingCustomer}
        upcomingConfirmed={upcomingConfirmed}
      />

      {/* 今日の電話タスク */}
      <TodayTasks tasks={tasks} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="お客さん" value={customerCount} unit="人" />
        <Stat label="登録車両" value={vehicleCount} unit="台" />
        <Stat label="60日以内に車検" value={tasks.length} unit="台" />
      </section>

      <RegistrationQrSection
        token={shop.registration_token}
        shopName={shop.name}
      />

      <DemoDataPanel />
    </main>
  )
}

async function RegistrationQrSection({
  token,
  shopName,
}: {
  token: string
  shopName: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const registrationUrl = `${appUrl}/r/${token}`

  return (
    <section
      className="rounded-xl border p-6"
      style={{
        background: 'var(--surface-1)',
        borderColor: 'var(--hairline)',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-eyebrow"
            style={{ color: 'var(--ink-tertiary)' }}
          >
            Registration QR
          </p>
          <h2
            className="mt-1 text-title"
            style={{ color: 'var(--ink)' }}
          >
            お客様向け 登録QR・URL
          </h2>
        </div>
      </div>
      <p
        className="mt-2 text-sm"
        style={{ color: 'var(--ink-subtle)' }}
      >
        このQR / URL をお客様に渡すと、お客様自身が愛車を{shopName}
        に登録できます。
      </p>
      <div className="mt-5 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <QrDisplay text={registrationUrl} />
        <div className="flex-1 space-y-2">
          <p
            className="text-eyebrow"
            style={{ color: 'var(--ink-tertiary)' }}
          >
            登録URL
          </p>
          <code
            className="block break-all rounded-md px-3 py-2 font-mono text-xs"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--ink-muted)',
            }}
          >
            {registrationUrl}
          </code>
          <p className="text-xs" style={{ color: 'var(--ink-tertiary)' }}>
            ※ このURLは推測されないランダムな値です。お客様だけにお渡しください。
          </p>
        </div>
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string
  value: number
  unit: string
}) {
  return (
    <div
      className="card-base card-hover p-5"
      style={{
        background: 'var(--surface-1)',
        borderColor: 'var(--hairline)',
      }}
    >
      <p
        className="text-eyebrow"
        style={{ color: 'var(--ink-tertiary)' }}
      >
        {label}
      </p>
      <p
        className="mt-2 tabular-figs text-3xl font-bold"
        style={{ color: 'var(--ink)' }}
      >
        {value.toLocaleString()}
        <span
          className="ml-1 text-sm font-medium"
          style={{ color: 'var(--ink-subtle)' }}
        >
          {unit}
        </span>
      </p>
    </div>
  )
}

