'use server'

import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

/**
 * デモ用ダミーデータを一括投入する Server Action (Phase A-1)
 *
 * リハーサル/デモ用に、現店舗に「ザ・整備工場の現実」っぽい一式を入れる。
 * 既存データは消さず、追加するだけ（既存顧客の隣にダミー顧客が並ぶ）。
 */
export async function seedDemoData() {
  const { shop } = await getCurrentShop()
  const admin = createAdminClient()
  const now = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const addMonths = (d: Date, m: number) => {
    const x = new Date(d)
    x.setMonth(x.getMonth() + m)
    return x
  }
  const addDays = (d: Date, days: number) => {
    const x = new Date(d)
    x.setDate(x.getDate() + days)
    return x
  }

  // 1. 顧客を3名作成
  const customers = [
    {
      id: randomUUID(),
      shop_id: shop.id,
      name: '佐藤 健太 (デモ)',
      phone: '09000000001',
      email: null,
      line_user_id: null,
      memo: 'ロードスター乗り。週末はよく峠に行く。',
    },
    {
      id: randomUUID(),
      shop_id: shop.id,
      name: '山田 美咲 (デモ)',
      phone: '09000000002',
      email: null,
      line_user_id: null,
      memo: '通勤・お買い物用。整備のことはお任せタイプ。',
    },
    {
      id: randomUUID(),
      shop_id: shop.id,
      name: '田中 修 (デモ)',
      phone: '09000000003',
      email: null,
      line_user_id: null,
      memo: 'プロボックスで毎日100km走る現場仕事。',
    },
  ]
  const { error: custErr } = await admin.from('customers').insert(customers)
  if (custErr) return { error: `顧客作成失敗: ${custErr.message}` }

  // 2. 各顧客に車両を1台ずつ
  const vehicles = [
    {
      id: randomUUID(),
      shop_id: shop.id,
      customer_id: customers[0].id,
      model: 'マツダ ロードスター RF',
      plate_number: '品川 300 と 12-34',
      first_registration_ym: '2022-04',
      inspection_expires_on: iso(addMonths(now, 2)), // 車検2ヶ月後 = 通知ターゲット
      purchased_on: '2022-04-10',
      last_oil_change_on: iso(addMonths(now, -3)),
      photo_url: null,
      view_token: randomUUID(),
    },
    {
      id: randomUUID(),
      shop_id: shop.id,
      customer_id: customers[1].id,
      model: 'スズキ ハスラー',
      plate_number: '川口 580 あ 56-78',
      first_registration_ym: '2023-09',
      inspection_expires_on: iso(addMonths(now, 8)),
      purchased_on: '2023-09-15',
      last_oil_change_on: iso(addMonths(now, -2)),
      photo_url: null,
      view_token: randomUUID(),
    },
    {
      id: randomUUID(),
      shop_id: shop.id,
      customer_id: customers[2].id,
      model: 'トヨタ プロボックス',
      plate_number: '春日部 400 か 90-12',
      first_registration_ym: '2019-06',
      inspection_expires_on: iso(addMonths(now, 14)),
      purchased_on: '2019-06-20',
      last_oil_change_on: iso(addMonths(now, -1)),
      photo_url: null,
      view_token: randomUUID(),
    },
  ]
  const { error: vehErr } = await admin.from('vehicles').insert(vehicles)
  if (vehErr) return { error: `車両作成失敗: ${vehErr.message}` }

  // 3. 整備記録を5件
  const maintenance = [
    {
      id: randomUUID(),
      shop_id: shop.id,
      vehicle_id: vehicles[0].id,
      performed_on: iso(addMonths(now, -3)),
      mileage_km: 24500,
      title: 'オイル交換 + フィルター交換',
      description: '走行距離 24,500km。次回 29,500km または 3ヶ月後。',
      parts: 'Mobil1 5W-30, オイルフィルター',
      cost: 8800,
      created_by: 'shop',
      attachment_url: null,
    },
    {
      id: randomUUID(),
      shop_id: shop.id,
      vehicle_id: vehicles[0].id,
      performed_on: iso(addMonths(now, -8)),
      mileage_km: 21800,
      title: 'タイヤ4本交換',
      description: 'ブリヂストン Potenza S007A。サマータイヤから履き替え。',
      parts: 'POTENZA S007A 205/45R17 ×4',
      cost: 98000,
      created_by: 'shop',
      attachment_url: null,
    },
    {
      id: randomUUID(),
      shop_id: shop.id,
      vehicle_id: vehicles[1].id,
      performed_on: iso(addMonths(now, -2)),
      mileage_km: 8400,
      title: 'オイル交換',
      description: 'ハスラーの初回点検も兼ねて。',
      parts: 'スズキ純正オイル 0W-20',
      cost: 4500,
      created_by: 'shop',
      attachment_url: null,
    },
    {
      id: randomUUID(),
      shop_id: shop.id,
      vehicle_id: vehicles[2].id,
      performed_on: iso(addMonths(now, -1)),
      mileage_km: 156200,
      title: '車検整備（ブレーキパッド交換含む）',
      description: 'パッド残量1mm。フロント・リア交換。検査一発合格。',
      parts: 'ブレーキパッド フロント/リア, ワイパーゴム',
      cost: 78000,
      created_by: 'shop',
      attachment_url: null,
    },
    {
      id: randomUUID(),
      shop_id: shop.id,
      vehicle_id: vehicles[0].id,
      performed_on: iso(addDays(now, -10)),
      mileage_km: 25100,
      title: '洗車してきました',
      description: '近所のコイン洗車で。次は手洗いしたい。',
      parts: null,
      cost: null,
      created_by: 'customer',
      attachment_url: null,
    },
  ]
  const { error: mntErr } = await admin
    .from('maintenance_records')
    .insert(maintenance)
  if (mntErr) return { error: `整備記録作成失敗: ${mntErr.message}` }

  // 4. ツーリング記録を2件 (ロードスターのお客様)
  const tourings = [
    {
      id: randomUUID(),
      shop_id: shop.id,
      vehicle_id: vehicles[0].id,
      touring_date: iso(addDays(now, -14)),
      title: '箱根ターンパイク',
      place_name: '大観山展望台',
      address: '神奈川県足柄下郡箱根町',
      latitude: 35.2228,
      longitude: 139.0224,
      photo_url: null,
      memo: '富士山が綺麗だった。屋根開けて気持ちよかった。',
      created_by: 'customer',
    },
    {
      id: randomUUID(),
      shop_id: shop.id,
      vehicle_id: vehicles[0].id,
      touring_date: iso(addDays(now, -40)),
      title: '伊豆スカイライン',
      place_name: '十国峠',
      address: '静岡県田方郡函南町',
      latitude: 35.1247,
      longitude: 139.0042,
      photo_url: null,
      memo: '朝焼けの中を走った。最高。',
      created_by: 'customer',
    },
  ]
  const { error: trErr } = await admin
    .from('touring_records')
    .insert(tourings)
  if (trErr) return { error: `ツーリング作成失敗: ${trErr.message}` }

  revalidatePath('/dashboard')
  revalidatePath('/customers')
  return {
    ok: true,
    summary: {
      customers: customers.length,
      vehicles: vehicles.length,
      maintenance: maintenance.length,
      tourings: tourings.length,
      // 一番見せやすい view_token を返す → デモ時に「これが客側の画面」と見せれる
      demoMyPageToken: vehicles[0].view_token,
    },
  }
}

/**
 * デモデータを一括削除 (デモが終わった後の掃除用)
 * 名前に "(デモ)" を含む顧客と、その関連レコードだけ消す。
 */
export async function clearDemoData() {
  const { shop } = await getCurrentShop()
  const admin = createAdminClient()

  // 1. デモ顧客のIDを取得
  const { data: demoCustomers } = await admin
    .from('customers')
    .select('id')
    .eq('shop_id', shop.id)
    .like('name', '%(デモ)%')

  if (!demoCustomers || demoCustomers.length === 0) {
    return { ok: true, removed: 0 }
  }

  const ids = demoCustomers.map((c) => c.id)

  // 2. 顧客削除（cascade で vehicles/maintenance/touring も削除される想定）
  // ※ FK の ON DELETE CASCADE が無い場合は手動で全部消す必要あり
  const { data: demoVehicles } = await admin
    .from('vehicles')
    .select('id')
    .in('customer_id', ids)

  const vehicleIds = (demoVehicles ?? []).map((v) => v.id)

  if (vehicleIds.length > 0) {
    await admin
      .from('maintenance_records')
      .delete()
      .in('vehicle_id', vehicleIds)
    await admin.from('touring_records').delete().in('vehicle_id', vehicleIds)
    await admin.from('vehicle_photos').delete().in('vehicle_id', vehicleIds)
    await admin.from('notifications').delete().in('vehicle_id', vehicleIds)
    await admin.from('vehicles').delete().in('id', vehicleIds)
  }
  await admin.from('customers').delete().in('id', ids)

  revalidatePath('/dashboard')
  revalidatePath('/customers')
  return { ok: true, removed: ids.length }
}
