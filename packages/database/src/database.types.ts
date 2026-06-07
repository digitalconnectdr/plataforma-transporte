/**
 * Auto-generated Supabase database types.
 * Regenerate with: supabase gen types typescript --linked > packages/database/src/database.types.ts
 *
 * This is a typed placeholder matching the F1.1 schema.
 * Run the command above after any schema change.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          status: 'trial' | 'active' | 'suspended' | 'cancelled'
          plan: 'free' | 'starter' | 'professional' | 'enterprise'
          logo_url: string | null
          primary_color: string | null
          phone: string | null
          email: string | null
          address: string | null
          city: string | null
          country: string
          timezone: string
          currency: string
          distance_unit: 'miles' | 'km'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_connect_account_id: string | null
          stripe_connect_onboarded: boolean
          settings: Json
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['companies']['Row']> & {
          name: string
          slug: string
        }
        Update: Partial<Database['public']['Tables']['companies']['Row']>
      }
      user_profiles: {
        Row: {
          id: string
          company_id: string
          role: 'super_admin' | 'company_owner' | 'company_admin' | 'dispatcher' | 'accounting' | 'driver' | 'customer' | 'corporate_manager' | 'corporate_user'
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
        Insert: Partial<Database['public']['Tables']['user_profiles']['Row']> & {
          id: string
          company_id: string
          first_name: string
          last_name: string
        }
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>
      }
      vehicles: {
        Row: {
          id: string
          company_id: string
          vehicle_type_id: string
          make: string
          model: string
          year: number
          color: string | null
          plate_number: string
          vin: string | null
          status: 'available' | 'in_use' | 'maintenance' | 'inactive'
          current_driver_id: string | null
          mileage: number
          last_maintenance_at: string | null
          next_maintenance_at: string | null
          insurance_expires_at: string | null
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['vehicles']['Row']> & {
          company_id: string
          vehicle_type_id: string
          make: string
          model: string
          year: number
          plate_number: string
        }
        Update: Partial<Database['public']['Tables']['vehicles']['Row']>
      }
      vehicle_types: {
        Row: {
          id: string
          company_id: string
          name: string
          class: 'sedan' | 'suv' | 'van' | 'limousine' | 'sprinter' | 'bus' | 'exotic'
          capacity: number
          amenities: string[]
          base_image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['vehicle_types']['Row']> & {
          company_id: string
          name: string
          class: Database['public']['Tables']['vehicle_types']['Row']['class']
        }
        Update: Partial<Database['public']['Tables']['vehicle_types']['Row']>
      }
      drivers: {
        Row: {
          id: string
          company_id: string
          license_number: string | null
          license_expiry: string | null
          license_state: string | null
          current_vehicle_id: string | null
          is_available: boolean
          rating: number
          total_trips: number
          total_earnings: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['drivers']['Row']> & {
          id: string
          company_id: string
        }
        Update: Partial<Database['public']['Tables']['drivers']['Row']>
      }
      bookings: {
        Row: {
          id: string
          company_id: string
          booking_number: string
          status: 'quote' | 'pending' | 'assigned' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'failed'
          type: 'one_way' | 'round_trip' | 'hourly' | 'multi_stop' | 'airport_pickup' | 'airport_dropoff'
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
          waypoints: Json[]
          scheduled_at: string
          flight_number: string | null
          flight_arrival_at: string | null
          meet_and_greet: boolean
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
          currency: string
          gratuity_amount: number
          gratuity_pct: number
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
        Insert: Partial<Database['public']['Tables']['bookings']['Row']> & {
          company_id: string
          pickup_location: Json
          dropoff_location: Json
          scheduled_at: string
        }
        Update: Partial<Database['public']['Tables']['bookings']['Row']>
      }
      payments: {
        Row: {
          id: string
          company_id: string
          booking_id: string | null
          customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_charge_id: string | null
          stripe_connect_account_id: string | null
          amount: number
          currency: string
          platform_fee: number
          net_amount: number | null
          status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled'
          payment_method: 'card' | 'bank_transfer' | 'cash' | 'corporate_account' | 'invoice'
          stripe_payment_method_id: string | null
          description: string | null
          metadata: Json
          failure_code: string | null
          failure_message: string | null
          captured_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['payments']['Row']> & {
          company_id: string
          amount: number
        }
        Update: Partial<Database['public']['Tables']['payments']['Row']>
      }
      notifications: {
        Row: {
          id: string
          company_id: string
          user_id: string | null
          booking_id: string | null
          template_id: string | null
          channel: 'email' | 'sms' | 'push' | 'in_app'
          type: string
          recipient: string
          subject: string | null
          body: string
          status: 'pending' | 'sent' | 'failed' | 'delivered'
          provider_id: string | null
          error_message: string | null
          sent_at: string | null
          delivered_at: string | null
          opened_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & {
          company_id: string
          channel: Database['public']['Tables']['notifications']['Row']['channel']
          type: string
          recipient: string
          body: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: {
      auth_company_id: { Args: Record<string, never>; Returns: string }
      auth_role: { Args: Record<string, never>; Returns: string }
      auth_has_role: { Args: { roles: string[] }; Returns: boolean }
      generate_booking_number: { Args: { p_company_id: string }; Returns: string }
    }
    Enums: {
      user_role: 'super_admin' | 'company_owner' | 'company_admin' | 'dispatcher' | 'accounting' | 'driver' | 'customer' | 'corporate_manager' | 'corporate_user'
      company_status: 'trial' | 'active' | 'suspended' | 'cancelled'
      company_plan: 'free' | 'starter' | 'professional' | 'enterprise'
      booking_status: 'quote' | 'pending' | 'assigned' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'failed'
      booking_type: 'one_way' | 'round_trip' | 'hourly' | 'multi_stop' | 'airport_pickup' | 'airport_dropoff'
      vehicle_class: 'sedan' | 'suv' | 'van' | 'limousine' | 'sprinter' | 'bus' | 'exotic'
      vehicle_status: 'available' | 'in_use' | 'maintenance' | 'inactive'
      payment_status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded' | 'cancelled'
      payment_method_type: 'card' | 'bank_transfer' | 'cash' | 'corporate_account' | 'invoice'
      notification_channel: 'email' | 'sms' | 'push' | 'in_app'
      pricing_model: 'flat_rate' | 'per_mile' | 'per_km' | 'hourly' | 'zone_based'
    }
    CompositeTypes: Record<string, never>
  }
}
