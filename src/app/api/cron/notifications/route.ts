import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import {
  buildInspectionReminderSubject,
  buildInspectionReminderText,
  type InspectionReminderParams,
} from '@/lib/mail-templates'

// このルートは Cron 専用なのでキャッシュさせない
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type ResultEntry =
  | { vehicle_id: string; target: string; status: 'sent' }
  | { vehicle_id: string; target: string; status: 'skipped'; reason: string }
  | { vehicle_id: string; target: string; status: 'failed'; error: string }

const TARGETS: ReadonlyArray<{
  label: InspectionReminderParams['reminderLabel']
  days: number
}> = [
  { label: '3ヶ月', days: 90 },
  { label: '1ヶ月', days: 30 },
  { label: '2週間', days: 14 },
]

export async function GET(req: Request) {
  // Vercel Cron は Authorization: Bearer ${CRON_SECRET} を自動付与
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dry') === '1'

  // service_role キーで RLS をバイパスして全shopの全データを処理
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  )

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const results: ResultEntry[] = []

  for (const target of TARGETS) {
    const expireDate = new Date(today)
    expireDate.setDate(expireDate.getDate() + target.days)
    const expireStr = expireDate.toISOString().slice(0, 10)

    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(
        'id, customer_id, shop_id, model, plate_number, inspection_expires_on'
      )
      .eq('inspection_expires_on', expireStr)

    if (vehiclesError) {
      return NextResponse.json(
        { error: vehiclesError.message, target: target.label },
        { status: 500 }
      )
    }

    for (const v of vehicles ?? []) {
      // 二重送信チェック
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('vehicle_id', v.id)
        .eq('kind', 'inspection')
        .eq('scheduled_on', todayStr)
        .maybeSingle()

      if (existing) {
        results.push({
          vehicle_id: v.id,
          target: target.label,
          status: 'skipped',
          reason: 'already processed today',
        })
        continue
      }

      // 顧客取得
      const { data: customer } = await supabase
        .from('customers')
        .select('name, email')
        .eq('id', v.customer_id)
        .maybeSingle()

      if (!customer) {
        results.push({
          vehicle_id: v.id,
          target: target.label,
          status: 'failed',
          error: 'customer not found',
        })
        continue
      }

      if (!customer.email) {
        if (!dryRun) {
          await supabase.from('notifications').insert({
            vehicle_id: v.id,
            kind: 'inspection',
            scheduled_on: todayStr,
            channel: 'mail',
            status: 'failed',
            message: `[${target.label}] customer has no email`,
          })
        }
        results.push({
          vehicle_id: v.id,
          target: target.label,
          status: 'failed',
          error: 'customer has no email',
        })
        continue
      }

      // 店舗取得
      const { data: shop } = await supabase
        .from('shops')
        .select('name')
        .eq('id', v.shop_id)
        .maybeSingle()

      const params: InspectionReminderParams = {
        shopName: shop?.name ?? '店舗',
        customerName: customer.name,
        vehicleModel: v.model,
        vehiclePlate: v.plate_number,
        expiresOn: v.inspection_expires_on!,
        reminderLabel: target.label,
      }
      const subject = buildInspectionReminderSubject(params)
      const text = buildInspectionReminderText(params)

      if (dryRun) {
        results.push({
          vehicle_id: v.id,
          target: target.label,
          status: 'sent',
        })
        continue
      }

      try {
        const resend = getResend()
        const { error: sendError } = await resend.emails.send({
          from: `${params.shopName} <${FROM_EMAIL}>`,
          to: customer.email,
          subject,
          text,
        })

        if (sendError) {
          throw new Error(sendError.message || String(sendError))
        }

        await supabase.from('notifications').insert({
          vehicle_id: v.id,
          kind: 'inspection',
          scheduled_on: todayStr,
          sent_at: new Date().toISOString(),
          channel: 'mail',
          status: 'sent',
          message: subject,
        })
        results.push({
          vehicle_id: v.id,
          target: target.label,
          status: 'sent',
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        await supabase.from('notifications').insert({
          vehicle_id: v.id,
          kind: 'inspection',
          scheduled_on: todayStr,
          channel: 'mail',
          status: 'failed',
          message: `[${target.label}] ${msg}`,
        })
        results.push({
          vehicle_id: v.id,
          target: target.label,
          status: 'failed',
          error: msg,
        })
      }
    }
  }

  return NextResponse.json({
    ok: true,
    date: todayStr,
    dryRun,
    count: results.length,
    results,
  })
}
