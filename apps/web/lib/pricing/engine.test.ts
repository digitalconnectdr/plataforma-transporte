import { describe, it, expect } from 'vitest'
import {
  calculateFare,
  bestRule,
  getLocalTimeParts,
  type PricingRuleFields,
} from './engine'

// Regla base sin recargos para aislar cada caso
function rule(overrides: Partial<PricingRuleFields> = {}): PricingRuleFields {
  return {
    id: 'r1',
    vehicle_type_id: null,
    model: 'per_mile',
    base_price: 10,
    per_mile_rate: 3,
    per_km_rate: null,
    hourly_rate: null,
    minimum_fare: null,
    airport_pickup_fee: null,
    airport_dropoff_fee: null,
    night_surcharge_pct: null,
    weekend_surcharge_pct: null,
    surge_enabled: false,
    surge_multiplier: null,
    ...overrides,
  }
}

// Miércoles 2026-06-17 a las 14:00 en Santo Domingo (UTC-4) = 18:00 UTC
const WEEKDAY_AFTERNOON = new Date('2026-06-17T18:00:00Z')
const TZ_SD = 'America/Santo_Domingo'

describe('calculateFare — modelos', () => {
  it('per_mile: base + tarifa por milla', () => {
    const fare = calculateFare(rule(), 10, 20, WEEKDAY_AFTERNOON, 'one_way', TZ_SD)
    expect(fare.baseAmount).toBe(40) // 10 + 3*10
    expect(fare.surchargeAmount).toBe(0)
    expect(fare.totalAmount).toBe(40)
  })

  it('flat_rate ignora distancia', () => {
    const fare = calculateFare(
      rule({ model: 'flat_rate', base_price: 75 }),
      100, 60, WEEKDAY_AFTERNOON, 'one_way', TZ_SD,
    )
    expect(fare.totalAmount).toBe(75)
  })

  it('per_km convierte millas a km', () => {
    const fare = calculateFare(
      rule({ model: 'per_km', base_price: 0, per_km_rate: 2 }),
      10, 20, WEEKDAY_AFTERNOON, 'one_way', TZ_SD,
    )
    expect(fare.baseAmount).toBeCloseTo(32.19, 2) // 10mi = 16.0934km * 2
  })

  it('hourly cobra por duración', () => {
    const fare = calculateFare(
      rule({ model: 'hourly', hourly_rate: 110 }),
      5, 90, WEEKDAY_AFTERNOON, 'one_way', TZ_SD,
    )
    expect(fare.baseAmount).toBe(165) // 1.5h * 110
  })

  it('aplica tarifa mínima', () => {
    const fare = calculateFare(
      rule({ minimum_fare: 50 }),
      2, 10, WEEKDAY_AFTERNOON, 'one_way', TZ_SD, // base sería 16
    )
    expect(fare.baseAmount).toBe(50)
  })
})

describe('calculateFare — recargos con timezone (el bug de UTC)', () => {
  // 01:00 UTC = 21:00 del día anterior en Santo Domingo → NO es noche local
  const UTC_NIGHT_LOCAL_EVENING = new Date('2026-06-17T01:00:00Z') // martes 21:00 SD

  it('NO aplica recargo nocturno cuando es noche en UTC pero no en hora local', () => {
    const fare = calculateFare(
      rule({ night_surcharge_pct: 20 }),
      10, 20, UTC_NIGHT_LOCAL_EVENING, 'one_way', TZ_SD,
    )
    expect(fare.surchargeAmount).toBe(0)
  })

  it('aplica recargo nocturno con el comportamiento UTC anterior (sin timezone)', () => {
    const fare = calculateFare(
      rule({ night_surcharge_pct: 20 }),
      10, 20, UTC_NIGHT_LOCAL_EVENING, 'one_way', undefined,
    )
    expect(fare.surchargeAmount).toBe(8) // 20% de 40
  })

  it('aplica recargo nocturno cuando es de noche en hora local', () => {
    // 03:00 UTC = 23:00 SD (martes) → noche local
    const lateNight = new Date('2026-06-17T03:00:00Z')
    const fare = calculateFare(
      rule({ night_surcharge_pct: 20 }),
      10, 20, lateNight, 'one_way', TZ_SD,
    )
    expect(fare.surchargeAmount).toBe(8)
  })

  it('detecta fin de semana en hora local aunque en UTC ya sea lunes', () => {
    // Lunes 2026-06-15 02:00 UTC = domingo 22:00 SD → weekend local
    const sundayNightLocal = new Date('2026-06-15T02:00:00Z')
    const fare = calculateFare(
      rule({ weekend_surcharge_pct: 15 }),
      10, 20, sundayNightLocal, 'one_way', TZ_SD,
    )
    expect(fare.surchargeAmount).toBe(6) // 15% de 40
  })

  it('timezone inválido cae a UTC sin lanzar', () => {
    const fare = calculateFare(
      rule({ night_surcharge_pct: 20 }),
      10, 20, UTC_NIGHT_LOCAL_EVENING, 'one_way', 'Invalid/Zone',
    )
    expect(fare.surchargeAmount).toBe(8) // comportamiento UTC
  })
})

describe('calculateFare — fees y surge', () => {
  it('suma fee de aeropuerto según tipo de booking', () => {
    const r = rule({ airport_pickup_fee: 15, airport_dropoff_fee: 10 })
    expect(calculateFare(r, 10, 20, WEEKDAY_AFTERNOON, 'airport_pickup', TZ_SD).surchargeAmount).toBe(15)
    expect(calculateFare(r, 10, 20, WEEKDAY_AFTERNOON, 'airport_dropoff', TZ_SD).surchargeAmount).toBe(10)
    expect(calculateFare(r, 10, 20, WEEKDAY_AFTERNOON, 'one_way', TZ_SD).surchargeAmount).toBe(0)
  })

  it('surge multiplica sobre la base', () => {
    const fare = calculateFare(
      rule({ surge_enabled: true, surge_multiplier: 1.5 }),
      10, 20, WEEKDAY_AFTERNOON, 'one_way', TZ_SD,
    )
    expect(fare.surchargeAmount).toBe(20) // 0.5 * 40
    expect(fare.totalAmount).toBe(60)
  })
})

describe('bestRule', () => {
  it('prefiere la regla específica del tipo de vehículo', () => {
    const general = rule({ id: 'general', vehicle_type_id: null })
    const specific = rule({ id: 'specific', vehicle_type_id: 'vt1' })
    expect(bestRule([general, specific], 'vt1')?.id).toBe('specific')
  })

  it('cae a la regla general si no hay específica', () => {
    const general = rule({ id: 'general', vehicle_type_id: null })
    const other = rule({ id: 'other', vehicle_type_id: 'vt2' })
    expect(bestRule([other, general], 'vt1')?.id).toBe('general')
  })

  it('devuelve undefined sin reglas aplicables', () => {
    const other = rule({ id: 'other', vehicle_type_id: 'vt2' })
    expect(bestRule([other], 'vt1')).toBeUndefined()
  })
})

describe('getLocalTimeParts', () => {
  it('convierte UTC a hora local de Santo Domingo (UTC-4)', () => {
    const parts = getLocalTimeParts(new Date('2026-06-17T18:00:00Z'), TZ_SD)
    expect(parts.hour).toBe(14)
    expect(parts.day).toBe(3) // miércoles
  })

  it('sin timezone usa UTC', () => {
    const parts = getLocalTimeParts(new Date('2026-06-17T18:00:00Z'), null)
    expect(parts.hour).toBe(18)
  })
})
