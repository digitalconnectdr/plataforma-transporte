// ─── Pricing Types ────────────────────────────────────────────────────────────

export type PricingModel =
  | 'flat_rate'          // Fixed price regardless of distance/time
  | 'per_mile'           // Base + price per mile
  | 'per_km'             // Base + price per km
  | 'hourly'             // Price per hour with minimum
  | 'zone_based'         // Fixed price per zone-to-zone pair

export interface PricingRule {
  id: string
  company_id: string
  vehicle_type_id: string
  service_id: string | null      // null = applies to all services
  zone_from_id: string | null    // null = not zone-based
  zone_to_id: string | null
  model: PricingModel
  // Base pricing
  base_amount: number            // In cents — minimum fare or flat rate
  per_mile_amount: number        // In cents per mile
  per_km_amount: number          // In cents per km
  per_minute_amount: number      // In cents per minute (for hourly/wait)
  hourly_rate: number            // In cents per hour
  minimum_hours: number          // For hourly bookings
  // Modifiers
  airport_fee: number            // In cents — flat fee for airport trips
  after_hours_surcharge_pct: number  // 0-100 percentage
  after_hours_start: string      // "22:00"
  after_hours_end: string        // "06:00"
  holiday_surcharge_pct: number
  weekend_surcharge_pct: number
  // Validity
  is_active: boolean
  effective_from: string | null
  effective_to: string | null
  created_at: string
  updated_at: string
}

export interface ServiceZone {
  id: string
  company_id: string
  name: string                   // e.g., "Orlando International Airport"
  type: 'airport' | 'city' | 'neighborhood' | 'county' | 'custom'
  // GeoJSON polygon or radius
  geometry_type: 'polygon' | 'radius'
  polygon: GeoJSONPolygon | null
  center_lat: number | null
  center_lng: number | null
  radius_km: number | null
  is_active: boolean
  created_at: string
}

export interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: [number, number][][]
}

// The result of pricing calculation
export interface PriceQuote {
  base_rate: number        // In cents
  distance_km: number | null
  duration_min: number | null
  fees: Array<{ type: string; label: string; amount: number }>
  gratuity_amount: number
  tax_amount: number
  total_amount: number     // In cents
  currency: string
  pricing_rule_id: string
  expires_at: string       // Quote valid for 30 minutes
}
