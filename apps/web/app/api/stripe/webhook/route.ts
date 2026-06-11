// ── F1.9 — Stripe Webhook Handler ─────────────────────────────────────────────
// Verifica firma SIEMPRE. Actualiza payments/refunds/companies vía service role.
// Idempotente: las actualizaciones se basan en IDs únicos de Stripe.

import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { constructWebhookEvent, isStripeConfigured } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const payload = await request.text()
    event = constructWebhookEvent(payload, signature)
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      // ── Pago completado vía Checkout ────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const paymentId = session.metadata?.payment_id
        if (!paymentId) break

        const piId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null

        await admin
          .from('payments')
          .update({
            status: 'succeeded',
            stripe_payment_intent_id: piId,
            captured_at: new Date().toISOString(),
          })
          .eq('id', paymentId)
        break
      }

      // ── Sesión expirada sin pagar ───────────────────────────────────────────
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const paymentId = session.metadata?.payment_id
        if (!paymentId) break

        await admin
          .from('payments')
          .update({ status: 'cancelled' })
          .eq('id', paymentId)
          .eq('status', 'pending') // no tocar pagos ya exitosos
        break
      }

      // ── PaymentIntent: actualizar charge id / fallas ────────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const paymentId = pi.metadata?.payment_id
        if (!paymentId) break

        const chargeId =
          typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id ?? null

        await admin
          .from('payments')
          .update({
            status: 'succeeded',
            stripe_payment_intent_id: pi.id,
            stripe_charge_id: chargeId,
            captured_at: new Date().toISOString(),
          })
          .eq('id', paymentId)
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        const paymentId = pi.metadata?.payment_id
        if (!paymentId) break

        await admin
          .from('payments')
          .update({
            status: 'failed',
            stripe_payment_intent_id: pi.id,
            failure_code: pi.last_payment_error?.code ?? null,
            failure_message: pi.last_payment_error?.message ?? null,
          })
          .eq('id', paymentId)
          .neq('status', 'succeeded')
        break
      }

      // ── Reembolsos ──────────────────────────────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        for (const refund of charge.refunds?.data ?? []) {
          await admin
            .from('refunds')
            .update({ status: refund.status === 'failed' ? 'failed' : 'succeeded' })
            .eq('stripe_refund_id', refund.id)
        }
        if (charge.refunded) {
          await admin
            .from('payments')
            .update({ status: 'refunded' })
            .eq('stripe_charge_id', charge.id)
        }
        break
      }

      // ── Connect: estado de onboarding de la empresa ─────────────────────────
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const onboarded = Boolean(account.charges_enabled && account.details_submitted)
        await admin
          .from('companies')
          .update({ stripe_connect_onboarded: onboarded })
          .eq('stripe_connect_account_id', account.id)
        break
      }

      default:
        // Evento no manejado — OK, respondemos 200 para no reintentarlo
        break
    }
  } catch (err) {
    console.error(`[stripe/webhook] error handling ${event.type}`, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
