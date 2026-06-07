// ─── Company / Tenant Types ───────────────────────────────────────────────────

export type CompanyStatus = 'active' | 'suspended' | 'onboarding' | 'churned'
export type CompanyPlan = 'starter' | 'professional' | 'enterprise'

export interface Company {
  id: string
  name: string
  slug: string                // URL-safe identifier: "revival-transportation"
  status: CompanyStatus
  plan: CompanyPlan
  logo_url: string | null
  primary_color: string | null  // For white-labeling
  phone: string | null
  email: string | null
  website: string | null
  timezone: string             // e.g., "America/New_York"
  currency: string             // e.g., "USD"
  country_code: string         // e.g., "US"
  stripe_account_id: string | null  // Stripe Connect account
  stripe_account_enabled: boolean
  settings: CompanySettings
  created_at: string
  updated_at: string
}

export interface CompanySettings {
  // Booking settings
  allow_guest_booking: boolean
  require_phone_verification: boolean
  advance_booking_hours_min: number    // Minimum hours in advance to book
  advance_booking_days_max: number     // Maximum days in advance
  cancellation_window_hours: number    // Hours before trip to cancel free
  // Gratuity settings
  default_gratuity_percent: number
  allow_custom_gratuity: boolean
  // Notification settings
  send_booking_confirmation_sms: boolean
  send_driver_assigned_sms: boolean
  send_trip_reminder_hours: number
  // Operational
  allow_multi_stop: boolean
  max_stops: number
  // Branding
  booking_widget_theme: 'dark' | 'light'
}

export type CreateCompanyInput = Omit<Company, 'id' | 'created_at' | 'updated_at'>
export type UpdateCompanyInput = Partial<Omit<Company, 'id' | 'created_at'>>
