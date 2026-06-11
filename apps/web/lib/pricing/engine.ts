// ── Pricing Engine (puro, testeable) ──────────────────────────────────────────
// Extraído de app/actions/bookings.ts para poder testearlo con Vitest y para
// que los recargos usen la HORA LOCAL de la empresa (no UTC).

import type { BookingType } from '@/lib/supabase/database.types'

export interface PricingRuleFields {
  id: string
  vehicle_type_id: string | null
  model: string
  base_price: number
  per_mile_rate: number | null
  per_km_rate: number | null
  hourly_rate: number | null
  minimum_fare: number | null
  airport_pickup_fee: number | null
  airport_dropoff_fee: number | null
  night_surcharge_pct: number | null
  weekend_surcharge_pct: number | null
  surge_enabled: boolean | null
  surge_multiplier: number | null
}

export interface FareResult {
  baseAmount: number
  surchargeAmount: number
  totalAmount: number
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Hora y día de la semana LOCALES de la empresa.
 * Si el timezone es inválido, cae a UTC (comportamiento anterior).
 */
export function getLocalTimeParts(
  date: Date,
  timeZone: string | null | undefined,
): { hour: number; day: number } {
  if (timeZone) {
    try {
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        hourCycle: 'h23',
        weekday: 'short',
      })
      const parts = fmt.formatToParts(date)
      const hourStr = parts.find((p) => p.type === 'hour')?.value
      const weekday = parts.find((p) => p.type === 'weekday')?.value
      const DAY_INDEX: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
      }
      const hour = hourStr != null ? parseInt(hourStr, 10) : NaN
      const day = weekday != null ? DAY_INDEX[weekday] : undefined
      if (!Number.isNaN(hour) && day !== undefined) {
        return { hour, day }
      }
    } catch {
      // timezone inválido — fallback a UTC
    }
  }
  return { hour: date.getUTCHours(), day: date.getUTCDay() }
}

/**
 * Calcula la tarifa según el modelo de la regla + recargos.
 * Los recargos nocturno (22:00–06:00) y de fin de semana se evalúan en la
 * hora local de la empresa (`timezone`).
 */
export function calculateFare(
  rule: PricingRuleFields,
  distanceMiles: number,
  durationMinutes: number,
  scheduledAt: Date,
  bookingType: BookingType,
  timezone?: string | null,
): FareResult {
  let base = 0

  switch (rule.model) {
    case 'flat_rate':
      base = rule.base_price
      break
    case 'per_mile':
      base = rule.base_price + (rule.per_mile_rate ?? 0) * distanceMiles
      break
    case 'per_km': {
      const km = distanceMiles * 1.60934
      base = rule.base_price + (rule.per_km_rate ?? 0) * km
      break
    }
    case 'hourly':
      base = (rule.hourly_rate ?? 0) * (durationMinutes / 60)
      break
    case 'zone_based':
    default:
      base = rule.base_price
  }

  // Mínimo
  if (rule.minimum_fare && base < rule.minimum_fare) base = rule.minimum_fare

  // Recargos — hora local de la empresa
  let surcharge = 0
  const { hour, day } = getLocalTimeParts(scheduledAt, timezone)

  if ((hour >= 22 || hour < 6) && rule.night_surcharge_pct) {
    surcharge += base * (rule.night_surcharge_pct / 100)
  }
  if ((day === 0 || day === 6) && rule.weekend_surcharge_pct) {
    surcharge += base * (rule.weekend_surcharge_pct / 100)
  }
  if (bookingType === 'airport_pickup' && rule.airport_pickup_fee) {
    surcharge += rule.airport_pickup_fee
  }
  if (bookingType === 'airport_dropoff' && rule.airport_dropoff_fee) {
    surcharge += rule.airport_dropoff_fee
  }
  if (rule.surge_enabled && (rule.surge_multiplier ?? 1) > 1) {
    surcharge += base * ((rule.surge_multiplier ?? 1) - 1)
  }

  return {
    baseAmount: round2(base),
    surchargeAmount: round2(surcharge),
    totalAmount: round2(base + surcharge),
  }
}

/**
 * Mejor regla para un tipo de vehículo: específica del tipo primero,
 * luego la regla general (vehicle_type_id NULL). Las reglas vienen
 * ordenadas por priority DESC.
 */
export function bestRule(
  rules: PricingRuleFields[],
  vehicleTypeId: string | null,
): PricingRuleFields | undefined {
  return (
    rules.find((r) => vehicleTypeId && r.vehicle_type_id === vehicleTypeId) ??
    rules.find((r) => r.vehicle_type_id === null)
  )
}
