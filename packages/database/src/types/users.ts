// ─── User & RBAC Types ────────────────────────────────────────────────────────

/**
 * 9 roles in the platform.
 * Roles are scoped to a company_id (except super_admin which is global).
 */
export type UserRole =
  | 'super_admin'        // Platform owner — sees all companies, no company_id scope
  | 'company_owner'      // Can manage everything within their company
  | 'company_admin'      // Full admin minus billing/stripe
  | 'dispatcher'         // Assigns drivers, monitors trips in real time
  | 'accounting'         // Invoices, reports, refunds — read-only booking data
  | 'driver'             // Mobile app user — sees assigned trips only
  | 'customer'           // End customer who books trips
  | 'corporate_manager'  // Manages a corporate account (approves trips, sets limits)
  | 'corporate_user'     // Books trips under a corporate account

export interface UserProfile {
  id: string                // References auth.users(id)
  company_id: string | null // null for super_admin
  role: UserRole
  first_name: string
  last_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  last_seen_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Driver extends UserProfile {
  role: 'driver'
  driver_license_number: string
  driver_license_expiry: string
  driver_license_state: string
  background_check_status: 'pending' | 'approved' | 'rejected' | 'expired'
  background_check_date: string | null
  vehicle_id: string | null    // Currently assigned vehicle
  is_online: boolean
  current_lat: number | null
  current_lng: number | null
  rating: number               // 0.0 - 5.0
  total_trips: number
  joined_at: string
}

export interface Customer extends UserProfile {
  role: 'customer'
  preferred_vehicle_class: string | null
  special_instructions: string | null
  corporate_account_id: string | null
  stripe_customer_id: string | null
}

// The session user shape returned by auth helpers
export interface SessionUser {
  id: string
  email: string
  role: UserRole
  company_id: string | null
  profile: UserProfile
}
