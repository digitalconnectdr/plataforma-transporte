import Stripe from 'stripe'

/**
 * Stripe server client — only use in Server Actions and Route Handlers.
 * Never expose to client components.
 *
 * Placeholder-safe: while STRIPE_SECRET_KEY is not a real key (sk_test_/sk_live_),
 * getStripe() returns null and callers must degrade gracefully.
 */

let stripeSingleton: Stripe | null | undefined

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  // Las keys reales de Stripe tienen 24+ caracteres aleatorios tras el prefijo.
  // Rechaza explícitamente placeholders tipo "sk_test_placeholder".
  if (key.toLowerCase().includes('placeholder')) return false
  return /^sk_(test|live)_[A-Za-z0-9]{20,}/.test(key)
}

export function getStripe(): Stripe | null {
  if (stripeSingleton !== undefined) return stripeSingleton
  if (!isStripeConfigured()) {
    stripeSingleton = null
    return null
  }
  stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-04-10',
    typescript: true,
  })
  return stripeSingleton
}

/**
 * Construct a Stripe webhook event from a raw request.
 * Use in the /api/stripe/webhook Route Handler.
 * Throws if Stripe or the webhook secret is not configured.
 */
export function constructWebhookEvent(payload: string, signature: string): Stripe.Event {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe is not configured')
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
  if (!secret.startsWith('whsec_') || secret === 'whsec_placeholder') {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }
  return stripe.webhooks.constructEvent(payload, signature, secret)
}
