'use server'

import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function confirmReservation(
  reservationId: string,
  formData: FormData
): Promise<void> {
  const { shop } = await getCurrentShop()
  const admin = createAdminClient()

  const confirmed_date =
    ((formData.get('confirmed_date') as string) || '').trim() || null
  const confirmed_slot =
    ((formData.get('confirmed_slot') as string) || '').trim() || null
  const shop_note = ((formData.get('shop_note') as string) || '').trim() || null

  await admin
    .from('reservations')
    .update({
      status: 'confirmed',
      confirmed_date,
      confirmed_slot,
      shop_note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('shop_id', shop.id)

  revalidatePath('/reservations')
}

export async function rejectReservation(
  reservationId: string,
  formData: FormData
): Promise<void> {
  const { shop } = await getCurrentShop()
  const admin = createAdminClient()

  const shop_note = ((formData.get('shop_note') as string) || '').trim() || null

  await admin
    .from('reservations')
    .update({
      status: 'rejected',
      shop_note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('shop_id', shop.id)

  revalidatePath('/reservations')
}

export async function completeReservation(
  reservationId: string
): Promise<void> {
  const { shop } = await getCurrentShop()
  const admin = createAdminClient()

  await admin
    .from('reservations')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('shop_id', shop.id)

  revalidatePath('/reservations')
}
