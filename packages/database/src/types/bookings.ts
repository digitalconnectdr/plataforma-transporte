// ─── Booking Types ────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'quote'           // Price shown, not yet confirmed
  | 'pending'         // Confirmed by customer, awaiting driver assignment
  | 'assigned'        // Driver assigned
  | 'en_route'        // Driver on way to pickup
  | 'arrived'         // Driver arrived at pickup
  | 'in_progress'     // Trip started
  | 'completed'       // Trip finished, payment captured
  | 'cancelled'       // Cancelled (by customer, admin, or system)
  | 'no_show'         // Customer did not appear
  | 'failed'          // Payment or other system failure

export type BookingType =
  | 'one_way'         // Point A to Point B
  | 'round_trip'      // A → B → A
  | 'hourly'          // Booked by the hour
  | 'multi_stop'      // A → B → C → ... → Z
  | 'airport_pickup'  // From airport (flight tracking available)
  | 'airport_dropoff' // To airport

export interface BookingLocation {
  address: string
  lat: number
  lng: number
  place_id: string     // Google Places ID for re-geocoding
  name: string | null  // e.g., "The Ritz-Carlton"
  notes: string | null // e.g., "Use main entrance"
}

export interface BookingStop {
  id: string
  booking_id: string
  sequence: number
  location: BookingLocation
  arrival_time: string | null    // Scheduled
  actual_arrival_time: string | null
  completed: boolean
}

export interface Booking {
  id: string
  reference: string              // Human-readable: TRP-892A
  company_id: string
  customer_id: string
  driver_id: string | null
  vehicle_id: string | null
  service_id: string
  vehicle_type_id: string
  corporate_account_id: string | null
  type: BookingType
  status: BookingStatus
  // Locations
  pickup: BookingLocation
  dropoff: BookingLocation
  stops: BookingStop[]
  // Schedule
  pickup_datetime: string        // ISO 8601 UTC
  estimated_dropoff_datetime: string | null
  actual_pickup_datetime: string | null
  actual_dropoff_datetime: string | null
  // Passengers
  passenger_count: number
  passenger_name: string
  passenger_phone: string
  passenger_email: string
  passenger_notes: string | null
  // Flight info (for airport pickups)
  flight_number: string | null
  flight_origin: string | null
  // Pricing
  base_rate: number              // In cents
  distance_km: number | null
  duration_min: number | null
  extra_fees: BookingFee[]
  gratuity_amount: number        // In cents
  tax_amount: number             // In cents
  total_amount: number           // In cents — ALWAYS calculated server-side
  currency: string
  // Extras / amenities selected at booking
  extras: BookingExtra[]
  special_instructions: string | null
  // Internal
  dispatcher_notes: string | null
  created_at: string
  updated_at: string
}

export interface BookingFee {
  type: 'airport_fee' | 'toll' | 'parking' | 'waiting' | 'after_hours' | 'holiday' | 'custom'
  label: string
  amount: number // In cents
}

export interface BookingExtra {
  id: string
  label: string
  price: number  // In cents, 0 for complimentary
}

export interface BookingStatusHistory {
  id: string
  booking_id: string
  status: BookingStatus
  changed_by: string  // user_id
  notes: string | null
  timestamp: string
}

// Input types for creating/updating bookings
export type CreateBookingInput = {
  company_id: string
  service_id: string
  vehicle_type_id: string
  type: BookingType
  pickup: BookingLocation
  dropoff: BookingLocation
  stops?: Omit<BookingStop, 'id' | 'booking_id'>[]
  pickup_datetime: string
  passenger_count: number
  passenger_name: string
  passenger_phone: string
  passenger_email: string
  passenger_notes?: string
  flight_number?: string
  flight_origin?: string
  extras?: string[]          // Extra IDs
  special_instructions?: string
  corporate_account_id?: string
  // Price is calculated server-side — frontend never sends amounts
}
