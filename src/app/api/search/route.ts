import { NextResponse } from 'next/server'
import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * インクリメンタル検索 API (Phase L+ / Spotlight風)
 *
 * GET /api/search?q=keyword
 * 認証ユーザーの shop に紐づく顧客と車両を最大3件ずつ返す。
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()

  if (!q || q.length < 1) {
    return NextResponse.json({ customers: [], vehicles: [] })
  }

  try {
    const { shop } = await getCurrentShop()
    const admin = createAdminClient()
    const pattern = `%${q}%`

    const [{ data: customerRows }, { data: vehicleRows }] = await Promise.all([
      admin
        .from('customers')
        .select('id, name, phone, email, tags')
        .eq('shop_id', shop.id)
        .or(
          `name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`
        )
        .limit(3),
      admin
        .from('vehicles')
        .select(
          'id, model, plate_number, customer_id, inspection_expires_on'
        )
        .eq('shop_id', shop.id)
        .or(`model.ilike.${pattern},plate_number.ilike.${pattern}`)
        .limit(3),
    ])

    // 車両のお客様名も取得
    const customerIds = Array.from(
      new Set((vehicleRows ?? []).map((v) => v.customer_id))
    )
    const customerNameMap = new Map<string, string>()
    if (customerIds.length > 0) {
      const { data } = await admin
        .from('customers')
        .select('id, name')
        .in('id', customerIds)
      for (const c of (data ?? []) as { id: string; name: string }[]) {
        customerNameMap.set(c.id, c.name)
      }
    }

    const customers = (customerRows ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      tags: c.tags ?? [],
    }))

    const vehicles = (vehicleRows ?? []).map((v) => ({
      id: v.id,
      model: v.model,
      plate_number: v.plate_number,
      inspection_expires_on: v.inspection_expires_on,
      customer_id: v.customer_id,
      customer_name: customerNameMap.get(v.customer_id) ?? '—',
    }))

    return NextResponse.json({ customers, vehicles })
  } catch (e) {
    console.error('search API failed:', e)
    return NextResponse.json(
      { customers: [], vehicles: [], error: 'search failed' },
      { status: 500 }
    )
  }
}
