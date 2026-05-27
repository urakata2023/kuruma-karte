'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type MaintenanceFormState = { error?: string } | undefined

function parseString(formData: FormData, key: string): string | null {
  const v = ((formData.get(key) as string) ?? '').trim()
  return v || null
}

function parseInt0(formData: FormData, key: string): number | null {
  const v = ((formData.get(key) as string) ?? '').trim()
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : null
}

export async function createMaintenanceRecord(
  vehicleId: string,
  _prev: MaintenanceFormState,
  formData: FormData
): Promise<MaintenanceFormState> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  // 車両がこの shop のものか確認
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('shop_id', shop.id)
    .single()
  if (!vehicle) return { error: '車両が見つかりません' }

  const title = parseString(formData, 'title')
  if (!title) return { error: '整備のタイトルを入力してください' }
  const performed_on = parseString(formData, 'performed_on')
  if (!performed_on) return { error: '整備日を入力してください' }

  const { error } = await supabase.from('maintenance_records').insert({
    vehicle_id: vehicleId,
    shop_id: shop.id,
    title,
    performed_on,
    mileage_km: parseInt0(formData, 'mileage_km'),
    description: parseString(formData, 'description'),
    parts: parseString(formData, 'parts'),
    cost: parseInt0(formData, 'cost'),
  })
  if (error) return { error: error.message }

  revalidatePath(`/vehicles/${vehicleId}`)
  revalidatePath('/dashboard')
  redirect(`/vehicles/${vehicleId}`)
}

export async function updateMaintenanceRecord(
  recordId: string,
  vehicleId: string,
  _prev: MaintenanceFormState,
  formData: FormData
): Promise<MaintenanceFormState> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  const title = parseString(formData, 'title')
  if (!title) return { error: '整備のタイトルを入力してください' }
  const performed_on = parseString(formData, 'performed_on')
  if (!performed_on) return { error: '整備日を入力してください' }

  const { error } = await supabase
    .from('maintenance_records')
    .update({
      title,
      performed_on,
      mileage_km: parseInt0(formData, 'mileage_km'),
      description: parseString(formData, 'description'),
      parts: parseString(formData, 'parts'),
      cost: parseInt0(formData, 'cost'),
    })
    .eq('id', recordId)
    .eq('shop_id', shop.id)
  if (error) return { error: error.message }

  revalidatePath(`/vehicles/${vehicleId}`)
  redirect(`/vehicles/${vehicleId}`)
}

export async function deleteMaintenanceRecord(
  recordId: string,
  vehicleId: string
): Promise<void> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()
  const { error } = await supabase
    .from('maintenance_records')
    .delete()
    .eq('id', recordId)
    .eq('shop_id', shop.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/vehicles/${vehicleId}`)
  redirect(`/vehicles/${vehicleId}`)
}
