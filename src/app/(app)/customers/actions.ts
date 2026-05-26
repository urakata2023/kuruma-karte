'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentShop } from '@/lib/shop'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type CustomerFormState = { error?: string } | undefined

export async function createCustomer(
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()
  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return { error: 'お名前を入力してください' }

  const phone = ((formData.get('phone') as string) ?? '').trim() || null
  const email = ((formData.get('email') as string) ?? '').trim() || null
  const memo = ((formData.get('memo') as string) ?? '').trim() || null

  const { error } = await supabase.from('customers').insert({
    shop_id: shop.id,
    name,
    phone,
    email,
    memo,
  })
  if (error) return { error: error.message }

  revalidatePath('/customers')
  revalidatePath('/dashboard')
  redirect('/customers')
}

export async function updateCustomer(
  id: string,
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()
  const name = ((formData.get('name') as string) ?? '').trim()
  if (!name) return { error: 'お名前を入力してください' }

  const phone = ((formData.get('phone') as string) ?? '').trim() || null
  const email = ((formData.get('email') as string) ?? '').trim() || null
  const memo = ((formData.get('memo') as string) ?? '').trim() || null

  const { error } = await supabase
    .from('customers')
    .update({ name, phone, email, memo })
    .eq('id', id)
    .eq('shop_id', shop.id)
  if (error) return { error: error.message }

  revalidatePath('/customers')
  revalidatePath(`/customers/${id}`)
  redirect(`/customers/${id}`)
}

export async function deleteCustomer(id: string): Promise<void> {
  const { shop } = await getCurrentShop()
  const supabase = await createClient()
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('shop_id', shop.id)
  if (error) throw new Error(error.message)

  revalidatePath('/customers')
  revalidatePath('/dashboard')
  redirect('/customers')
}
