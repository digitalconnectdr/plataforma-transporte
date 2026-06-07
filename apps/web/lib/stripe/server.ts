import Stripe from 'stripe'

/**
 * Stripe server client — only use in Server Actions and Route Handlers.
 * Never expose to client components.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

/**
 * Construct a Stripe webhook event from a raw request.
 * Use in the /api/stripe/webhook Route Handler.
 */
export async function constructWebhookEvent(
  payload: string,
  signature: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}
