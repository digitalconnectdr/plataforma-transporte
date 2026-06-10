'use server'
// ── F1.8 — Booking Engine: Server Actions ─────────────────────────────────────
// SECURITY: Precios siempre calculados server-side. Frontend NUNCA envía montos.
// OWASP Top 10 compliant — inputs validados, admin client para inserts en price_quotes.

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { calculateRoute } from '@/lib/maps/routes'
import type { BookingStatus, BookingType } from '@/lib/supabase/database.types'

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export interface QuoteResult {
  quoteId: string
  baseAmount: number
  surchargeAmount: number
  totalAmount: number
  currency: string
  distanceMiles: number | null
  durationMinutes: number | null
}

export interface BookingResult {
  bookingId: string
  bookingNumber: string
}

export interface VehicleQuote {
  vehicleType: {
    id: string
    name: string
    class: string
    capacity: number
    amenities: string[]
  }
  quoteId: string
  baseAmount: number
  surchargeAmount: number
  totalAmount: number
  currency: string
  distanceMiles: number | null
  durationMinutes: number | null
  noPrice: boolean
}

// ─── Máquina de estados — transiciones válidas ────────────────────────────────

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  quote:       ['pending', 'cancelled'],
  pending:     ['assigned', 'cancelled'],
  assigned:    ['en_route', 'cancelled', 'no_show'],
  en_route:    ['arrived', 'cancelled'],
  arrived:     ['in_progress', 'no_show'],
  in_progress: ['completed', 'failed'],
  completed:   [],
  cancelled:   [],
  no_show:     [],
  failed:      [],
}

// ─── Helper: cálculo de tarifa (server-only) ──────────────────────────────────

interface PricingRuleFields {
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

function calculateFare(
  rule: PricingRuleFields,
  distanceMiles: number,
  durationMinutes: number,
  scheduledAt: Date,
  bookingType: BookingType,
): { baseAmount: number; surchargeAmount: number; totalAmount: number } {
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

  // Recargos
  let surcharge = 0
  const hour = scheduledAt.getUTCHours()
  const day  = scheduledAt.getUTCDay()

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
    baseAmount:     Math.round(base * 100) / 100,
    surchargeAmount: Math.round(surcharge * 100) / 100,
    totalAmount:    Math.round((base + surcharge) * 100) / 100,
  }
}

// ─── Helper: mejor regla de precio para un tipo de vehículo ───────────────────

function bestRule(
  rules: PricingRuleFields[],
  vehicleTypeId: string | null,
): PricingRuleFields | undefined {
  return (
    rules.find((r) => vehicleTypeId && r.vehicle_type_id === vehicleTypeId) ??
    rules.find((r) => r.vehicle_type_id === null)
  )
}

// ─── Admin: Calcular cotización ───────────────────────────────────────────────

export async function calculateQuoteAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string; data?: QuoteResult }> {
  const user = await requireRole('company_owner', 'company_admin', 'dispatcher')
  if (!user.company_id) return { success: false, error: 'Sin empresa asignada' }

  const pickupLat    = parseFloat(formData.get('pickup_lat')  as string)
  const pickupLng    = parseFloat(formData.get('pickup_lng')  as string)
  const pickupAddr   = (formData.get('pickup')  as string) ?? ''
  const dropoffLat   = parseFloat(formData.get('dropoff_lat') as string)
  const dropoffLng   = parseFloat(formData.get('dropoff_lng') as string)
  const dropoffAddr  = (formData.get('dropoff') as string) ?? ''
  const vehicleTypeId = (formData.get('vehicle_type_id') as string) || null
  const scheduledAtStr = formData.get('scheduled_at') as string
  const bookingType  = ((formData.get('booking_type') as string) || 'one_way') as BookingType

  if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
    return { success: false, error: 'Coordenadas de pickup/dropoff requeridas. Selecciona la dirección del dropdown.' }
  }
  if (!scheduledAtStr) return { success: false, error: 'Fecha y hora requeridas' }

  const scheduledAt = new Date(scheduledAtStr)
  const admin = createAdminClient()

  // Obtener reglas de precio
  const { data: rulesRaw } = await admin
    .from('pricing_rules')
    .select('id, model, base_price, per_mile_rate, per_km_rate, hourly_rate, minimum_fare, airport_pickup_fee, airport_dropoff_fee, night_surcharge_pct, weekend_surcharge_pct, surge_enabled, surge_multiplier, vehicle_type_id, priority')
    .eq('company_id', user.company_id)
    .eq('is_active', true)
    .order('priority', { ascending: false })

  if (!rulesRaw?.length) {
    return { success: false, error: 'No hay reglas de precio activas. Configura precios en /admin/pricing.' }
  }

  const rule = bestRule(rulesRaw as unknown as PricingRuleFields[], vehicleTypeId)
  if (!rule) {
    return { success: false, error: 'No se encontró regla de precio para este vehículo' }
  }

  // Calcular ruta
  const route = await calculateRoute(pickupLat, pickupLng, dropoffLat, dropoffLng)
  const distanceMiles  = route?.distanceMi ?? 0
  const durationMinutes = route?.durationMinutes ?? 0

  const fare = calculateFare(rule, distanceMiles, durationMinutes, scheduledAt, bookingType)

  // Guardar cotización (admin client — no hay INSERT policy de usuario en price_quotes)
  const { data: quote, error } = await admin
    .from('price_quotes')
    .insert({
      company_id:      user.company_id,
      pricing_rule_id: rule.id,
      vehicle_type_id: vehicleTypeId,
      pickup_lat:      pickupLat,
      pickup_lng:      pickupLng,
      pickup_address:  pickupAddr,
      dropoff_lat:     dropoffLat,
      dropoff_lng:     dropoffLng,
      dropoff_address: dropoffAddr,
      distance_miles:  distanceMiles || null,
      duration_minutes: durationMinutes || null,
      base_amount:     fare.baseAmount,
      surcharge_amount: fare.surchargeAmount,
      total_amount:    fare.totalAmount,
      currency:        'USD',
    })
    .select('id')
    .single()

  if (error || !quote) {
    console.error('[calculateQuoteAction]', error)
    return { success: false, error: 'Error al guardar cotización' }
  }

  return {
    success: true,
    data: {
      quoteId:         quote.id,
      baseAmount:      fare.baseAmount,
      surchargeAmount: fare.surchargeAmount,
      totalAmount:     fare.totalAmount,
      currency:        'USD',
      distanceMiles:   distanceMiles || null,
      durationMinutes: durationMinutes || null,
    },
  }
}

// ─── Admin: Crear reservación ─────────────────────────────────────────────────

export async function createBookingAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string; data?: BookingResult }> {
  const user = await requireRole('company_owner', 'company_admin', 'dispatcher')
  if (!user.company_id) return { success: false, error: 'Sin empresa asignada' }

  const quoteId = formData.get('quote_id') as string
  if (!quoteId) return { success: false, error: 'Cotización requerida. Calcula el precio primero.' }

  const admin = createAdminClient()

  // Validar cotización — siempre del server (nunca del cliente)
  const { data: quote } = await admin
    .from('price_quotes')
    .select('*')
    .eq('id', quoteId)
    .eq('company_id', user.company_id)
    .eq('is_used', false)
    .single()

  if (!quote) return { success: false, error: 'Cotización no encontrada o ya utilizada' }
  if (new Date(quote.expires_at) < new Date()) {
    return { success: false, error: 'La cotización ha expirado. Recalcula el precio.' }
  }

  const pickupAddr   = formData.get('pickup')  as string
  const pickupLat    = parseFloat(formData.get('pickup_lat')  as string)
  const pickupLng    = parseFloat(formData.get('pickup_lng')  as string)
  const dropoffAddr  = formData.get('dropoff') as string
  const dropoffLat   = parseFloat(formData.get('dropoff_lat') as string)
  const dropoffLng   = parseFloat(formData.get('dropoff_lng') as string)
  const scheduledAt  = formData.get('scheduled_at') as string
  const bookingType  = ((formData.get('booking_type') as string) || 'one_way') as BookingType
  const passengerName  = (formData.get('passenger_name') as string)?.trim()
  const passengerPhone = (formData.get('passenger_phone') as string)?.trim()
  const passengerEmail = (formData.get('passenger_email') as string)?.trim()
  const passengerCount = parseInt(formData.get('passenger_count') as string) || 1
  const specialInstructions = (formData.get('special_instructions') as string)?.trim()
  const internalNotes = (formData.get('internal_notes') as string)?.trim()
  const flightNumber  = (formData.get('flight_number') as string)?.trim()

  if (!passengerName) return { success: false, error: 'Nombre del pasajero requerido' }
  if (!scheduledAt)   return { success: false, error: 'Fecha y hora requeridas' }
  if (!pickupAddr)    return { success: false, error: 'Dirección de pickup requerida' }
  if (!dropoffAddr)   return { success: false, error: 'Dirección de dropoff requerida' }

  const { data: booking, error } = await admin
    .from('bookings')
    .insert({
      company_id:       user.company_id,
      status:           'pending',
      type:             bookingType,
      vehicle_type_id:  quote.vehicle_type_id,
      passenger_count:  passengerCount,
      passenger_name:   passengerName,
      passenger_phone:  passengerPhone || null,
      passenger_email:  passengerEmail || null,
      pickup_location:  { address: pickupAddr,  lat: pickupLat,  lng: pickupLng  },
      dropoff_location: { address: dropoffAddr, lat: dropoffLat, lng: dropoffLng },
      scheduled_at:     scheduledAt,
      flight_number:    flightNumber || null,
      special_instructions: specialInstructions || null,
      internal_notes:   internalNotes || null,
      price_quote_id:   quoteId,
      // Montos SIEMPRE del quote (server-calculated) — nunca del form
      base_amount:      quote.base_amount,
      total_amount:     quote.total_amount,
      currency:         quote.currency ?? 'USD',
      distance_miles:   quote.distance_miles,
      duration_minutes: quote.duration_minutes,
    })
    .select('id, booking_number')
    .single()

  if (error || !booking) {
    console.error('[createBookingAction]', error)
    return { success: false, error: 'Error al crear reservación' }
  }

  // Marcar cotización como usada
  await admin.from('price_quotes').update({ is_used: true }).eq('id', quoteId)

  // Crear líneas de cargo (booking_fees)
  const fees: { booking_id: string; company_id: string; type: string; description: string; amount: number }[] = []
  if (quote.base_amount > 0) {
    fees.push({ booking_id: booking.id, company_id: user.company_id, type: 'base', description: 'Tarifa base', amount: quote.base_amount })
  }
  if (quote.surcharge_amount && quote.surcharge_amount > 0) {
    fees.push({ booking_id: booking.id, company_id: user.company_id, type: 'surcharge', description: 'Recargo', amount: quote.surcharge_amount })
  }
  if (fees.length > 0) await admin.from('booking_fees').insert(fees)

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/dashboard')
  return {
    success: true,
    data: { bookingId: booking.id, bookingNumber: booking.booking_number },
  }
}

// ─── Admin: Actualizar estado (máquina de estados) ────────────────────────────

export async function updateBookingStatusAction(
  bookingId: string,
  newStatus: BookingStatus,
  opts?: { reason?: string },
): Promise<{ success: boolean; error?: string }> {
  const user = await requireRole('company_owner', 'company_admin', 'dispatcher')
  if (!user.company_id) return { success: false, error: 'Sin empresa asignada' }

  const admin = createAdminClient()

  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, company_id')
    .eq('id', bookingId)
    .eq('company_id', user.company_id)
    .single()

  if (!booking) return { success: false, error: 'Reservación no encontrada' }

  const current = booking.status as BookingStatus
  const allowed = VALID_TRANSITIONS[current] ?? []
  if (!allowed.includes(newStatus)) {
    return { success: false, error: `Transición inválida: ${current} → ${newStatus}` }
  }

  const now = new Date().toISOString()
  const timestamps: Record<string, string> = {}
  if (newStatus === 'assigned')    timestamps.dispatched_at = now
  if (newStatus === 'en_route')    timestamps.en_route_at   = now
  if (newStatus === 'arrived')     timestamps.arrived_at    = now
  if (newStatus === 'in_progress') timestamps.started_at    = now
  if (newStatus === 'completed')   timestamps.completed_at  = now
  if (newStatus === 'cancelled')   timestamps.cancelled_at  = now
  if (newStatus === 'no_show')     timestamps.no_show_at    = now

  const updates: Record<string, unknown> = { status: newStatus, ...timestamps }
  if (newStatus === 'cancelled' && opts?.reason) {
    updates.cancellation_reason = opts.reason
    updates.cancelled_by = user.id
  }

  const { error } = await admin.from('bookings').update(updates).eq('id', bookingId)
  if (error) {
    console.error('[updateBookingStatusAction]', error)
    return { success: false, error: 'Error al actualizar estado' }
  }

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── Admin: Asignar conductor ─────────────────────────────────────────────────

export async function assignDriverAction(
  bookingId: string,
  driverId: string,
  vehicleId?: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await requireRole('company_owner', 'company_admin', 'dispatcher')
  if (!user.company_id) return { success: false, error: 'Sin empresa asignada' }

  const admin = createAdminClient()

  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, company_id')
    .eq('id', bookingId)
    .eq('company_id', user.company_id)
    .single()

  if (!booking) return { success: false, error: 'Reservación no encontrada' }

  const assignable: BookingStatus[] = ['pending', 'assigned']
  if (!assignable.includes(booking.status as BookingStatus)) {
    return { success: false, error: 'Solo reservaciones pendientes o asignadas pueden recibir conductor' }
  }

  const updates: Record<string, unknown> = {
    driver_id:     driverId,
    status:        'assigned',
    dispatched_at: new Date().toISOString(),
  }
  if (vehicleId) updates.vehicle_id = vehicleId

  const { error } = await admin.from('bookings').update(updates).eq('id', bookingId)
  if (error) {
    console.error('[assignDriverAction]', error)
    return { success: false, error: 'Error al asignar conductor' }
  }

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${bookingId}`)
  return { success: true }
}

// ─── Público: Cotizaciones por tipo de vehículo ───────────────────────────────

export async function getPublicVehicleQuotesAction(
  slug: string,
  data: {
    pickupLat: number
    pickupLng: number
    pickupAddress: string
    dropoffLat: number
    dropoffLng: number
    dropoffAddress: string
    scheduledAt: string
    bookingType?: BookingType
  },
): Promise<{ success: boolean; error?: string; data?: VehicleQuote[] }> {
  const admin = createAdminClient()

  const { data: company } = await admin
    .from('companies')
    .select('id, status, currency')
    .eq('slug', slug)
    .single()

  if (!company || company.status !== 'active') {
    return { success: false, error: 'Empresa no disponible' }
  }

  const companyId = company.id
  const currency  = (company.currency as string | null) ?? 'USD'
  const scheduledAt = new Date(data.scheduledAt)
  const bookingType = data.bookingType ?? 'one_way'

  // Tipos de vehículo activos
  const { data: vehicleTypes } = await admin
    .from('vehicle_types')
    .select('id, name, class, capacity, amenities')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('sort_order')

  if (!vehicleTypes?.length) {
    return { success: false, error: 'No hay tipos de vehículo disponibles' }
  }

  // Reglas de precio
  const { data: rulesRaw } = await admin
    .from('pricing_rules')
    .select('id, model, base_price, per_mile_rate, per_km_rate, hourly_rate, minimum_fare, airport_pickup_fee, airport_dropoff_fee, night_surcharge_pct, weekend_surcharge_pct, surge_enabled, surge_multiplier, vehicle_type_id, priority')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('priority', { ascending: false })

  // Calcular ruta una sola vez
  const route = await calculateRoute(
    data.pickupLat, data.pickupLng,
    data.dropoffLat, data.dropoffLng,
  )
  const distanceMiles  = route?.distanceMi ?? 0
  const durationMinutes = route?.durationMinutes ?? 0

  const quotes: VehicleQuote[] = []

  for (const vt of vehicleTypes) {
    const rule = bestRule(rulesRaw as unknown as PricingRuleFields[], vt.id)

    if (!rule) {
      quotes.push({
        vehicleType: { id: vt.id, name: vt.name, class: vt.class, capacity: vt.capacity, amenities: vt.amenities ?? [] },
        quoteId: '',
        baseAmount: 0, surchargeAmount: 0, totalAmount: 0,
        currency,
        distanceMiles: distanceMiles || null,
        durationMinutes: durationMinutes || null,
        noPrice: true,
      })
      continue
    }

    const fare = calculateFare(rule, distanceMiles, durationMinutes, scheduledAt, bookingType)

    const { data: quote } = await admin
      .from('price_quotes')
      .insert({
        company_id:      companyId,
        pricing_rule_id: rule.id,
        vehicle_type_id: vt.id,
        pickup_lat:      data.pickupLat,
        pickup_lng:      data.pickupLng,
        pickup_address:  data.pickupAddress,
        dropoff_lat:     data.dropoffLat,
        dropoff_lng:     data.dropoffLng,
        dropoff_address: data.dropoffAddress,
        distance_miles:  distanceMiles || null,
        duration_minutes: durationMinutes || null,
        base_amount:     fare.baseAmount,
        surcharge_amount: fare.surchargeAmount,
        total_amount:    fare.totalAmount,
        currency,
      })
      .select('id')
      .single()

    quotes.push({
      vehicleType: { id: vt.id, name: vt.name, class: vt.class, capacity: vt.capacity, amenities: vt.amenities ?? [] },
      quoteId:     quote?.id ?? '',
      baseAmount:  fare.baseAmount,
      surchargeAmount: fare.surchargeAmount,
      totalAmount: fare.totalAmount,
      currency,
      distanceMiles:   distanceMiles || null,
      durationMinutes: durationMinutes || null,
      noPrice: false,
    })
  }

  return { success: true, data: quotes }
}

// ─── Público: Crear reservación (guest checkout) ──────────────────────────────

export async function createPublicBookingAction(data: {
  quoteId: string
  slug: string
  bookingType: BookingType
  passengerName: string
  passengerPhone: string
  passengerEmail?: string
  passengerCount: number
  specialInstructions?: string
  flightNumber?: string
  scheduledAt: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  dropoffAddress: string
  dropoffLat: number
  dropoffLng: number
}): Promise<{ success: boolean; error?: string; data?: BookingResult }> {
  const admin = createAdminClient()

  const { data: company } = await admin
    .from('companies')
    .select('id, status')
    .eq('slug', data.slug)
    .single()

  if (!company || company.status !== 'active') {
    return { success: false, error: 'Empresa no disponible' }
  }

  // Validar cotización — montos SIEMPRE del server
  const { data: quote } = await admin
    .from('price_quotes')
    .select('*')
    .eq('id', data.quoteId)
    .eq('company_id', company.id)
    .eq('is_used', false)
    .single()

  if (!quote) return { success: false, error: 'Cotización no válida o ya utilizada' }
  if (new Date(quote.expires_at) < new Date()) {
    return { success: false, error: 'La cotización expiró. Regresa al paso 1 para recalcular.' }
  }

  // Validar campos obligatorios
  const name  = data.passengerName?.trim()
  const phone = data.passengerPhone?.trim()
  if (!name)  return { success: false, error: 'Nombre del pasajero requerido' }
  if (!phone) return { success: false, error: 'Teléfono requerido' }

  const { data: booking, error } = await admin
    .from('bookings')
    .insert({
      company_id:       company.id,
      status:           'pending',
      type:             data.bookingType,
      vehicle_type_id:  quote.vehicle_type_id,
      passenger_count:  data.passengerCount,
      passenger_name:   name,
      passenger_phone:  phone,
      passenger_email:  data.passengerEmail?.trim() || null,
      pickup_location:  { address: data.pickupAddress,  lat: data.pickupLat,  lng: data.pickupLng  },
      dropoff_location: { address: data.dropoffAddress, lat: data.dropoffLat, lng: data.dropoffLng },
      scheduled_at:     data.scheduledAt,
      flight_number:    data.flightNumber?.trim() || null,
      special_instructions: data.specialInstructions?.trim() || null,
      price_quote_id:   data.quoteId,
      base_amount:      quote.base_amount,
      total_amount:     quote.total_amount,
      currency:         quote.currency ?? 'USD',
      distance_miles:   quote.distance_miles,
      duration_minutes: quote.duration_minutes,
    })
    .select('id, booking_number')
    .single()

  if (error || !booking) {
    console.error('[createPublicBookingAction]', error)
    return { success: false, error: 'Error al crear reservación. Intenta de nuevo.' }
  }

  await admin.from('price_quotes').update({ is_used: true }).eq('id', data.quoteId)

  const fees: { booking_id: string; company_id: string; type: string; description: string; amount: number }[] = []
  if (quote.base_amount > 0) {
    fees.push({ booking_id: booking.id, company_id: company.id, type: 'base', description: 'Tarifa base', amount: quote.base_amount })
  }
  if (quote.surcharge_amount && quote.surcharge_amount > 0) {
    fees.push({ booking_id: booking.id, company_id: company.id, type: 'surcharge', description: 'Recargo', amount: quote.surcharge_amount })
  }
  if (fees.length > 0) await admin.from('booking_fees').insert(fees)

  return {
    success: true,
    data: { bookingId: booking.id, bookingNumber: booking.booking_number },
  }
}
