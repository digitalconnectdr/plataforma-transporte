// ─── Payment Types ────────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'refunded' | 'partially_refunded' | 'failed' | 'cancelled'
export type PaymentMethod = 'card' | 'invoice' | 'corporate_account'

export interface Payment {
  id: string
  booking_id: string
  company_id: string
  customer_id: string
  corporate_account_id: string | null
  amount: number                 // In cents
  currency: string
  status: PaymentStatus
  method: PaymentMethod
  // Stripe
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  stripe_connect_account_id: string | null  // Company's Stripe Connect account
  // Card info (masked)
  card_last4: string | null
  card_brand: string | null
  // Invoice (for corporate)
  invoice_id: string | null
  // Breakdown
  platform_fee: number           // In cents — our platform fee
  company_amount: number         // In cents — goes to company's Stripe account
  // Timestamps
  authorized_at: string | null
  captured_at: string | null
  refunded_at: string | null
  created_at: string
  updated_at: string
}

export interface Refund {
  id: string
  payment_id: string
  booking_id: string
  company_id: string
  amount: number                 // In cents
  reason: 'cancellation' | 'driver_issue' | 'customer_request' | 'system_error' | 'other'
  reason_notes: string | null
  stripe_refund_id: string | null
  status: 'pending' | 'succeeded' | 'failed'
  created_by: string             // user_id who initiated the refund
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string         // e.g., "INV-2024-0042"
  company_id: string
  corporate_account_id: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
  amount: number                 // In cents
  tax_amount: number
  total_amount: number
  currency: string
  period_start: string
  period_end: string
  due_date: string
  paid_at: string | null
  stripe_invoice_id: string | null
  pdf_url: string | null
  line_items: InvoiceLineItem[]
  created_at: string
}

export interface InvoiceLineItem {
  booking_id: string
  reference: string
  description: string
  pickup_datetime: string
  amount: number
}
