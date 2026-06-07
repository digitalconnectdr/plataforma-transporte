/**
 * LuxeRide — Local Database type definitions for Supabase client generics.
 *
 * Row types are defined as standalone interfaces (NOT as self-referential
 * properties inside the Database object) to avoid circular type references
 * that TypeScript resolves as `never`.
 *
 * Keep in sync with supabase/migrations/*.sql
 */

// ─── JSON ──────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Enum types ────────────────────────────────────────────────────────────────

export type UserRole =
  | 'super_admin'
  | 'company_owner'
  | 'company_admin'
  | 'dispatcher'
  | 'accounting'
  | 'driver'
  | 'customer'
  | 'corporate_manager'
  | 'corporate_user'

export type CompanyStatus = 'active' | 'suspended' | 'trial' | 'cancelled'
export type CompanyPlan = 'free' | 'starter' | 'professional' | 'enterprise'

export type VehicleClass =
  | 'sedan'
  | 'suv'
  | 'van'
  | 'limousine'
  | 'sprinter'
  | 'bus'
  | 'exotic'

export type VehicleStatus = 'available' | 'on_trip' | 'maintenance' | 'offline' | 'retired'

export type BookingStatus =
  | 'quote'
  | 'pending'
  | 'assigned'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'failed'

export type BookingType =
  | 'one_way'
  | 'round_trip'
  | 'hourly'
  | 'airport_pickup'
  | 'airport_dropoff'
  | 'point_to_point'

export type PricingModel =
  | 'flat_rate'
  | 'per_mile'
  | 'per_km'
  | 'hourly'
  | 'zone_based'

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'cancelled'

export type PaymentMethodType = 'card' | 'cash' | 'corporate_account' | 'bank_transfer'

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app'

export type DocumentType =
  | 'drivers_license'
  | 'vehicle_registration'
  | 'insurance'
  | 'background_check'
  | 'medical_certificate'
  | 'other'

// ─── Row interfaces (standalone — no circular refs) ───────────────────────────

interface CompanyRow {
  id: string
  name: string
  slug: string
  status: CompanyStatus
  plan: CompanyPlan
  logo_url: string | null
  primary_color: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  country: string | null
  timezone: string | null
  currency: string | null
  distance_unit: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_connect_account_id: string | null
  stripe_connect_onboarded: boolean | null
  settings: Json
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

interface UserProfileRow {
  id: string
  company_id: string
  role: UserRole
  first_name: string
  last_name: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  last_seen_at: string | null
  metadata: Json
  created_at: string
  updated_at: string
}

interface VehicleTypeRow {
  id: string
  company_id: string
  name: string
  class: VehicleClass
  capacity: number
  amenities: string[]
  base_image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface VehicleRow {
  id: string
  company_id: string
  vehicle_type_id: string
  make: string
  model: string
  year: number
  color: string | null
  plate_number: string
  vin: string | null
  status: VehicleStatus
  current_driver_id: string | null
  mileage: number | null
  last_maintenance_at: string | null
  next_maintenance_at: string | null
  insurance_expires_at: string | null
  notes: string | null
  metadata: Json
  created_at: string
  updated_at: string
}

interface DriverRow {
  id: string
  company_id: string
  license_number: string | null
  license_expiry: string | null
  license_state: string | null
  current_vehicle_id: string | null
  is_available: boolean
  rating: number | null
  total_trips: number
  total_earnings: number
  notes: string | null
  created_at: string
  updated_at: string
}

interface MaintenanceRecordRow {
  id: string
  company_id: string
  vehicle_id: string
  type: string
  description: string | null
  cost: number | null
  mileage_at_service: number | null
  performed_at: string
  next_due_at: string | null
  technician: string | null
  shop_name: string | null
  notes: string | null
  created_at: string
}

interface ServiceZoneRow {
  id: string
  company_id: string
  name: string
  type: string
  geometry: Json | null
  center_lat: number | null
  center_lng: number | null
  radius_miles: number | null
  color: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AirportRow {
  id: string
  iata_code: string
  icao_code: string | null
  name: string
  city: string
  state: string | null
  country: string
  lat: number | null
  lng: number | null
  terminal_count: number | null
  is_active: boolean
  created_at: string
}

interface CompanyAirportRow {
  id: string
  company_id: string
  airport_id: string
  pickup_fee: number
  dropoff_fee: number
  is_active: boolean
  created_at: string
}

interface PricingRuleRow {
  id: string
  company_id: string
  vehicle_type_id: string | null
  name: string
  model: PricingModel
  base_price: number
  per_mile_rate: number | null
  per_km_rate: number | null
  hourly_rate: number | null
  minimum_fare: number | null
  origin_zone_id: string | null
  destination_zone_id: string | null
  airport_pickup_fee: number | null
  airport_dropoff_fee: number | null
  night_surcharge_pct: number | null
  weekend_surcharge_pct: number | null
  holiday_surcharge_pct: number | null
  surge_enabled: boolean | null
  surge_multiplier: number | null
  valid_from: string | null
  valid_until: string | null
  days_of_week: number[] | null
  priority: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PriceQuoteRow {
  id: string
  company_id: string
  pricing_rule_id: string | null
  vehicle_type_id: string | null
  pickup_lat: number | null
  pickup_lng: number | null
  pickup_address: string | null
  dropoff_lat: number | null
  dropoff_lng: number | null
  dropoff_address: string | null
  distance_miles: number | null
  duration_minutes: number | null
  base_amount: number
  surcharge_amount: number | null
  tax_amount: number | null
  total_amount: number
  currency: string | null
  expires_at: string
  is_used: boolean | null
  created_at: string
}

interface BookingRow {
  id: string
  company_id: string
  booking_number: string
  status: BookingStatus
  type: BookingType
  customer_id: string | null
  driver_id: string | null
  vehicle_id: string | null
  vehicle_type_id: string | null
  corporate_account_id: string | null
  passenger_count: number
  passenger_name: string | null
  passenger_phone: string | null
  passenger_email: string | null
  pickup_location: Json
  dropoff_location: Json
  waypoints: Json[] | null
  scheduled_at: string
  flight_number: string | null
  flight_arrival_at: string | null
  meet_and_greet: boolean | null
  sign_name: string | null
  dispatched_at: string | null
  en_route_at: string | null
  arrived_at: string | null
  started_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  no_show_at: string | null
  distance_miles: number | null
  duration_minutes: number | null
  actual_distance_miles: number | null
  actual_duration_minutes: number | null
  price_quote_id: string | null
  base_amount: number | null
  total_amount: number | null
  currency: string | null
  gratuity_amount: number | null
  gratuity_pct: number | null
  special_instructions: string | null
  internal_notes: string | null
  cancellation_reason: string | null
  cancelled_by: string | null
  rating: number | null
  rating_comment: string | null
  rated_at: string | null
  created_at: string
  updated_at: string
}

interface BookingFeeRow {
  id: string
  booking_id: string
  company_id: string
  type: string
  description: string | null
  amount: number
  created_at: string
}

interface BookingExtraRow {
  id: string
  booking_id: string
  company_id: string
  name: string
  quantity: number | null
  unit_price: number
  total_price: number
  created_at: string
}

interface PaymentRow {
  id: string
  company_id: string
  booking_id: string | null
  customer_id: string | null
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  stripe_connect_account_id: string | null
  amount: number
  currency: string
  platform_fee: number | null
  net_amount: number | null
  status: PaymentStatus
  payment_method: PaymentMethodType
  stripe_payment_method_id: string | null
  description: string | null
  metadata: Json
  failure_code: string | null
  failure_message: string | null
  captured_at: string | null
  created_at: string
  updated_at: string
}

interface RefundRow {
  id: string
  company_id: string
  payment_id: string
  booking_id: string | null
  stripe_refund_id: string | null
  amount: number
  reason: string | null
  status: string
  initiated_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface InvoiceRow {
  id: string
  company_id: string
  customer_id: string | null
  corporate_account_id: string | null
  invoice_number: string
  status: string
  subtotal: number
  tax_amount: number | null
  discount_amount: number | null
  total_amount: number
  currency: string | null
  notes: string | null
  due_date: string | null
  sent_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

interface InvoiceLineItemRow {
  id: string
  invoice_id: string
  booking_id: string | null
  description: string
  quantity: number | null
  unit_price: number
  total_price: number
  created_at: string
}

// Stubs for corporate, notifications, documents, audit_logs, realtime
interface CorporateAccountRow {
  id: string
  company_id: string
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  billing_address: string | null
  credit_limit: number | null
  current_balance: number | null
  payment_terms: number | null
  is_active: boolean
  notes: string | null
  metadata: Json
  created_at: string
  updated_at: string
}

interface NotificationRow {
  id: string
  company_id: string
  user_id: string | null
  booking_id: string | null
  channel: NotificationChannel
  type: string
  subject: string | null
  body: string
  status: string
  sent_at: string | null
  error: string | null
  metadata: Json
  created_at: string
}

interface DocumentRow {
  id: string
  company_id: string
  user_id: string | null
  vehicle_id: string | null
  type: DocumentType
  name: string
  url: string
  expires_at: string | null
  is_verified: boolean
  verified_by: string | null
  verified_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface AuditLogRow {
  id: string
  company_id: string | null
  user_id: string | null
  action: string
  table_name: string | null
  record_id: string | null
  old_data: Json | null
  new_data: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// ─── Helper: Insert type (requires mandatory fields, rest optional) ─────────────

type TableInsert<Row extends Record<string, unknown>, Required extends keyof Row> = Partial<Row> &
  Pick<Row, Required>

// ─── Database ──────────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: CompanyRow
        Insert: TableInsert<CompanyRow, 'name' | 'slug'>
        Update: Partial<CompanyRow>
        Relationships: []
      }
      user_profiles: {
        Row: UserProfileRow
        Insert: TableInsert<UserProfileRow, 'id' | 'company_id' | 'first_name' | 'last_name'>
        Update: Partial<UserProfileRow>
        Relationships: []
      }
      vehicle_types: {
        Row: VehicleTypeRow
        Insert: TableInsert<VehicleTypeRow, 'company_id' | 'name' | 'class'>
        Update: Partial<VehicleTypeRow>
        Relationships: []
      }
      vehicles: {
        Row: VehicleRow
        Insert: TableInsert<VehicleRow, 'company_id' | 'vehicle_type_id' | 'make' | 'model' | 'year' | 'plate_number'>
        Update: Partial<VehicleRow>
        Relationships: []
      }
      drivers: {
        Row: DriverRow
        Insert: TableInsert<DriverRow, 'id' | 'company_id'>
        Update: Partial<DriverRow>
        Relationships: []
      }
      maintenance_records: {
        Row: MaintenanceRecordRow
        Insert: TableInsert<MaintenanceRecordRow, 'company_id' | 'vehicle_id' | 'type' | 'performed_at'>
        Update: Partial<MaintenanceRecordRow>
        Relationships: []
      }
      service_zones: {
        Row: ServiceZoneRow
        Insert: TableInsert<ServiceZoneRow, 'company_id' | 'name' | 'type'>
        Update: Partial<ServiceZoneRow>
        Relationships: []
      }
      airports: {
        Row: AirportRow
        Insert: TableInsert<AirportRow, 'iata_code' | 'name' | 'city' | 'country'>
        Update: Partial<AirportRow>
        Relationships: []
      }
      company_airports: {
        Row: CompanyAirportRow
        Insert: TableInsert<CompanyAirportRow, 'company_id' | 'airport_id'>
        Update: Partial<CompanyAirportRow>
        Relationships: []
      }
      pricing_rules: {
        Row: PricingRuleRow
        Insert: TableInsert<PricingRuleRow, 'company_id' | 'name' | 'model' | 'base_price'>
        Update: Partial<PricingRuleRow>
        Relationships: []
      }
      price_quotes: {
        Row: PriceQuoteRow
        Insert: TableInsert<PriceQuoteRow, 'company_id' | 'base_amount' | 'total_amount'>
        Update: Partial<PriceQuoteRow>
        Relationships: []
      }
      bookings: {
        Row: BookingRow
        Insert: TableInsert<BookingRow, 'company_id' | 'pickup_location' | 'dropoff_location' | 'scheduled_at'>
        Update: Partial<BookingRow>
        Relationships: []
      }
      booking_fees: {
        Row: BookingFeeRow
        Insert: TableInsert<BookingFeeRow, 'booking_id' | 'company_id' | 'type' | 'amount'>
        Update: Partial<BookingFeeRow>
        Relationships: []
      }
      booking_extras: {
        Row: BookingExtraRow
        Insert: TableInsert<BookingExtraRow, 'booking_id' | 'company_id' | 'name' | 'unit_price' | 'total_price'>
        Update: Partial<BookingExtraRow>
        Relationships: []
      }
      payments: {
        Row: PaymentRow
        Insert: TableInsert<PaymentRow, 'company_id' | 'amount' | 'currency' | 'status' | 'payment_method'>
        Update: Partial<PaymentRow>
        Relationships: []
      }
      refunds: {
        Row: RefundRow
        Insert: TableInsert<RefundRow, 'company_id' | 'payment_id' | 'amount' | 'status'>
        Update: Partial<RefundRow>
        Relationships: []
      }
      invoices: {
        Row: InvoiceRow
        Insert: TableInsert<InvoiceRow, 'company_id' | 'invoice_number' | 'status' | 'subtotal' | 'total_amount'>
        Update: Partial<InvoiceRow>
        Relationships: []
      }
      invoice_line_items: {
        Row: InvoiceLineItemRow
        Insert: TableInsert<InvoiceLineItemRow, 'invoice_id' | 'description' | 'unit_price' | 'total_price'>
        Update: Partial<InvoiceLineItemRow>
        Relationships: []
      }
      corporate_accounts: {
        Row: CorporateAccountRow
        Insert: TableInsert<CorporateAccountRow, 'company_id' | 'name'>
        Update: Partial<CorporateAccountRow>
        Relationships: []
      }
      notifications: {
        Row: NotificationRow
        Insert: TableInsert<NotificationRow, 'company_id' | 'channel' | 'type' | 'body' | 'status'>
        Update: Partial<NotificationRow>
        Relationships: []
      }
      documents: {
        Row: DocumentRow
        Insert: TableInsert<DocumentRow, 'company_id' | 'type' | 'name' | 'url'>
        Update: Partial<DocumentRow>
        Relationships: []
      }
      audit_logs: {
        Row: AuditLogRow
        Insert: TableInsert<AuditLogRow, 'action'>
        Update: Partial<AuditLogRow>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      auth_has_role: {
        Args: { roles: UserRole[] }
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      company_status: CompanyStatus
      company_plan: CompanyPlan
      vehicle_class: VehicleClass
      vehicle_status: VehicleStatus
      booking_status: BookingStatus
      booking_type: BookingType
      pricing_model: PricingModel
      payment_status: PaymentStatus
      payment_method_type: PaymentMethodType
      notification_channel: NotificationChannel
      document_type: DocumentType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
