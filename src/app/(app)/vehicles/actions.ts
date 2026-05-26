'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type VehicleFormState = { error?: string } | undefined

function parseField(formData: FormData, key: string): string | null {
  const v = ((formData.get(key) as string) ?? '').trim()
  return v || null
}

export async function createVehicle(
  customerId: string,
  _prev: VehicleFormState,
  formData: FormData
): Promise<VehicleFormState> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  // 顧客がこのshopのものか確認
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('shop_id', shop.id)
    .single()
  if (!customer) return { error: '顧客が見つかりません' }

  const { error } = await supabase.from('vehicles').insert({
    customer_id: customerId,
    shop_id: shop.id,
    model: parseField(formData, 'model'),
    plate_number: parseField(formData, 'plate_number'),
    first_registration_ym: parseField(formData, 'first_registration_ym'),
    inspection_expires_on: parseField(formData, 'inspection_expires_on'),
    purchased_on: parseField(formData, 'purchased_on'),
    last_oil_change_on: parseField(formData, 'last_oil_change_on'),
  })
  if (error) return { error: error.message }

  revalidatePath(`/customers/${customerId}`)
  revalidatePath('/dashboard')
  redirect(`/customers/${customerId}`)
}

export async function updateVehicle(
  id: string,
  customerId: string,
  _prev: VehicleFormState,
  formData: FormData
): Promise<VehicleFormState> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()

  const { error } = await supabase
    .from('vehicles')
    .update({
      model: parseField(formData, 'model'),
      plate_number: parseField(formData, 'plate_number'),
      first_registration_ym: parseField(formData, 'first_registration_ym'),
      inspection_expires_on: parseField(formData, 'inspection_expires_on'),
      purchased_on: parseField(formData, 'purchased_on'),
      last_oil_change_on: parseField(formData, 'last_oil_change_on'),
    })
    .eq('id', id)
    .eq('shop_id', shop.id)
  if (error) return { error: error.message }

  revalidatePath(`/customers/${customerId}`)
  revalidatePath('/dashboard')
  redirect(`/customers/${customerId}`)
}

export async function deleteVehicle(
  id: string,
  customerId: string
): Promise<void> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)
    .eq('shop_id', shop.id)
  if (error) throw new Error(error.message)

  revalidatePath(`/customers/${customerId}`)
  revalidatePath('/dashboard')
  redirect(`/customers/${customerId}`)
}
