// ─── Fleet Types ──────────────────────────────────────────────────────────────

export type VehicleClass = 'economy' | 'business' | 'first_class' | 'executive_suv' | 'sprinter_van' | 'minibus'
export type VehicleStatus = 'available' | 'on_trip' | 'maintenance' | 'inactive' | 'offline'

export interface VehicleType {
  id: string
  company_id: string
  name: string               // e.g., "Executive Sedan"
  class: VehicleClass
  description: string
  max_passengers: number
  max_luggage: number
  features: string[]         // e.g., ["WiFi", "Water", "USB Charging"]
  image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Vehicle {
  id: string
  company_id: string
  vehicle_type_id: string
  make: string               // e.g., "Mercedes-Benz"
  model: string              // e.g., "S-Class"
  year: number
  color: string
  license_plate: string
  vin: string | null
  status: VehicleStatus
  current_driver_id: string | null
  current_lat: number | null
  current_lng: number | null
  last_location_update: string | null
  mileage: number
  next_maintenance_date: string | null
  next_maintenance_mileage: number | null
  insurance_expiry: string
  registration_expiry: string
  notes: string | null
  photos: string[]           // Array of Supabase Storage URLs
  created_at: string
  updated_at: string
}

// Joined vehicle with its type info
export interface VehicleWithType extends Vehicle {
  vehicle_type: VehicleType
}

export interface MaintenanceRecord {
  id: string
  vehicle_id: string
  company_id: string
  type: 'scheduled' | 'repair' | 'inspection'
  description: string
  cost: number | null        // In cents
  performed_at: string
  mileage_at_service: number
  next_due_date: string | null
  next_due_mileage: number | null
  created_by: string
  created_at: string
}
