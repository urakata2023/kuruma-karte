'use server'

import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createCheckoutSession,
  createPortalSession,
  type PlanId,
} from '@/lib/stripe'
import { redirect } from 'next/navigation'

export async function startCheckout(plan: PlanId): Promise<void> {
  const { shop, userId, role } = await getCurrentShop()
  if (role !== 'owner') throw new Error('オーナー権限が必要です')

  const admin = createAdminClient()
  const { data: ownerUser } = await admin.auth.admin.getUserById(userId)
  const email = ownerUser?.user?.email
  if (!email) throw new Error('メールアドレスが取得できません')

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const url = await createCheckoutSession({
    shopId: shop.id,
    shopName: shop.name,
    customerEmail: email,
    plan,
    successUrl: `${appUrl}/billing?checkout=success`,
    cancelUrl: `${appUrl}/billing?checkout=cancel`,
    existingStripeCustomerId: shop.stripe_customer_id,
  })
  redirect(url)
}

export async function openCustomerPortal(): Promise<void> {
  const { shop, role } = await getCurrentShop()
  if (role !== 'owner') throw new Error('オーナー権限が必要です')

  if (!shop.stripe_customer_id) {
    throw new Error(
      'まだ Stripe Customer が紐づいていません (チェックアウト未完了)'
    )
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const url = await createPortalSession({
    stripeCustomerId: shop.stripe_customer_id,
    returnUrl: `${appUrl}/billing`,
  })
  redirect(url)
}
