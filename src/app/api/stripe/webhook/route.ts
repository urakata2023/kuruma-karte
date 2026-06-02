import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Stripe Webhook 受信 (Phase D)
 *
 * Stripe Dashboard で以下のイベントを購読:
 *  - checkout.session.completed
 *  - customer.subscription.created
 *  - customer.subscription.updated
 *  - customer.subscription.deleted
 *  - invoice.payment_failed
 *
 * STRIPE_WEBHOOK_SECRET に whsec_xxx を設定すること。
 */
export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'config missing' }, { status: 500 })
  }
  if (!sig) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'invalid signature' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const shopId = session.metadata?.shop_id
        if (shopId && session.customer && session.subscription) {
          await admin
            .from('shops')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: 'active',
              plan: (session.metadata?.plan as string) ?? 'standard',
            })
            .eq('id', shopId)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const shopId = sub.metadata?.shop_id
        if (shopId) {
          // current_period_end は Stripe API のバージョンによって場所が変わる
          // - 2024 系: sub.current_period_end (number = unix秒)
          // - 2025-2026 dahlia 以降: sub.items.data[0].current_period_end
          // 両方対応する
          const subRaw = sub as unknown as {
            current_period_end?: number
            items?: { data?: Array<{ current_period_end?: number }> }
          }
          const periodEnd =
            subRaw.current_period_end ??
            subRaw.items?.data?.[0]?.current_period_end ??
            null

          // checkout.session.completed が Webhook に未登録でも、ここで
          // plan / stripe_customer_id を埋められるように冗長化（防御的設計）
          await admin
            .from('shops')
            .update({
              stripe_subscription_id: sub.id,
              stripe_customer_id: sub.customer as string,
              subscription_status: sub.status,
              plan: (sub.metadata?.plan as string) ?? undefined,
              current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
            })
            .eq('id', shopId)
        }
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const shopId = sub.metadata?.shop_id
        if (shopId) {
          await admin
            .from('shops')
            .update({
              subscription_status: 'canceled',
              plan: 'trial',
            })
            .eq('id', shopId)
        }
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        await admin
          .from('shops')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)
        break
      }
    }
  } catch (e) {
    console.error('webhook handler error:', e)
    return NextResponse.json({ error: 'handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
