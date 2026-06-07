// ─── Notification Types ───────────────────────────────────────────────────────

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app'
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled'

export type NotificationTemplate =
  | 'booking_confirmation'
  | 'booking_reminder'        // Sent X hours before pickup
  | 'driver_assigned'
  | 'driver_en_route'
  | 'driver_arrived'
  | 'trip_started'
  | 'trip_completed'
  | 'trip_cancelled'
  | 'payment_confirmed'
  | 'payment_failed'
  | 'invoice_sent'
  | 'invoice_overdue'
  | 'welcome'
  | 'password_reset'
  | 'review_request'

export interface Notification {
  id: string
  company_id: string
  booking_id: string | null
  user_id: string              // Recipient
  channel: NotificationChannel
  template: NotificationTemplate
  status: NotificationStatus
  // Content
  subject: string | null       // For email
  body: string
  // Delivery
  sent_at: string | null
  delivered_at: string | null
  failed_reason: string | null
  // External provider IDs
  resend_id: string | null     // Resend email ID
  twilio_sid: string | null    // Twilio SMS SID
  created_at: string
}
