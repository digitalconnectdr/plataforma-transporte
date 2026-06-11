'use client'
// ── Booking Wizard — Portal público, 4 pasos ──────────────────────────────────
// Paso 1: Ruta y fecha
// Paso 2: Selección de vehículo (con precios calculados server-side)
// Paso 3: Datos del pasajero
// Paso 4: Confirmación + creación

import { useState, useTransition } from 'react'
import { AddressInput } from '@/components/maps/address-input'
import {
  getPublicVehicleQuotesAction,
  createPublicBookingAction,
  type VehicleQuote,
  type BookingResult,
} from '@/app/actions/bookings'
import { createPublicCheckoutAction } from '@/app/actions/payments'
import type { BookingType } from '@/lib/supabase/database.types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Company {
  id: string
  name: string
  slug: string
  currency: string
  primaryColor: string
  phone: string | null
  email: string | null
}

interface VehicleTypeInfo {
  id: string
  name: string
  class: string
  capacity: number
  amenities: string[]
  imageUrl: string | null
}

interface Props {
  company: Company
  vehicleTypes: VehicleTypeInfo[]
  onlinePaymentsEnabled?: boolean
}

// ─── Progreso ────────────────────────────────────────────────────────────────

const STEPS = ['Ruta', 'Vehículo', 'Pasajero', 'Confirmación']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            i < current ? 'bg-green-500 text-white' :
            i === current ? 'bg-[#0071e3] text-white' :
            'bg-gray-200 text-gray-400'
          }`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${
            i === current ? 'text-[#1d1d1f]' : 'text-gray-400'
          }`}>
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-8 mx-1 rounded ${i < current ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Clases de vehículo ───────────────────────────────────────────────────────

const CLASS_ICONS: Record<string, string> = {
  sedan: '🚗', suv: '🚙', van: '🚐', limousine: '🚘', sprinter: '🚌', bus: '🚌', exotic: '🏎️',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function BookingWizard({ company, vehicleTypes, onlinePaymentsEnabled = false }: Props) {
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Estado del wizard
  const [routeData, setRouteData] = useState({
    pickupAddress: '', pickupLat: 0, pickupLng: 0,
    dropoffAddress: '', dropoffLat: 0, dropoffLng: 0,
    scheduledAt: '', bookingType: 'one_way' as BookingType,
  })
  const [vehicleQuotes, setVehicleQuotes] = useState<VehicleQuote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<VehicleQuote | null>(null)
  const [passengerData, setPassengerData] = useState({
    name: '', phone: '', email: '', count: 1, instructions: '', flightNumber: '',
  })
  const [confirmation, setConfirmation] = useState<BookingResult | null>(null)

  // ─── PASO 1: Ruta ─────────────────────────────────────────────────────────

  function handleRouteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const fd = new FormData(e.currentTarget)
    const pickupLat  = parseFloat(fd.get('pickup_lat')  as string)
    const pickupLng  = parseFloat(fd.get('pickup_lng')  as string)
    const dropoffLat = parseFloat(fd.get('dropoff_lat') as string)
    const dropoffLng = parseFloat(fd.get('dropoff_lng') as string)

    if (!pickupLat || !pickupLng) {
      setError('Selecciona la dirección de pickup del dropdown de sugerencias')
      return
    }
    if (!dropoffLat || !dropoffLng) {
      setError('Selecciona la dirección de destino del dropdown de sugerencias')
      return
    }

    const scheduledAt = fd.get('scheduled_at') as string
    if (!scheduledAt) { setError('Selecciona fecha y hora'); return }

    const newRouteData = {
      pickupAddress:  fd.get('pickup')  as string,
      pickupLat, pickupLng,
      dropoffAddress: fd.get('dropoff') as string,
      dropoffLat, dropoffLng,
      scheduledAt,
      bookingType: (fd.get('booking_type') as BookingType) || 'one_way',
    }
    setRouteData(newRouteData)

    startTransition(async () => {
      const result = await getPublicVehicleQuotesAction(company.slug, {
        pickupLat:    newRouteData.pickupLat,
        pickupLng:    newRouteData.pickupLng,
        pickupAddress: newRouteData.pickupAddress,
        dropoffLat:   newRouteData.dropoffLat,
        dropoffLng:   newRouteData.dropoffLng,
        dropoffAddress: newRouteData.dropoffAddress,
        scheduledAt:  newRouteData.scheduledAt,
        bookingType:  newRouteData.bookingType,
      })

      if (!result.success || !result.data) {
        setError(result.error ?? 'Error al obtener precios')
        return
      }

      setVehicleQuotes(result.data)
      setStep(1)
    })
  }

  // ─── PASO 2: Vehículo ─────────────────────────────────────────────────────

  function handleSelectVehicle(q: VehicleQuote) {
    if (q.noPrice) return
    setSelectedQuote(q)
    setStep(2)
  }

  // ─── PASO 3: Pasajero ─────────────────────────────────────────────────────

  function handlePassengerSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string)?.trim()
    const phone = (fd.get('phone') as string)?.trim()

    if (!name)  { setError('Nombre requerido'); return }
    if (!phone) { setError('Teléfono requerido'); return }

    setPassengerData({
      name,
      phone,
      email:        (fd.get('email') as string)?.trim() ?? '',
      count:        parseInt(fd.get('count') as string) || 1,
      instructions: (fd.get('instructions') as string)?.trim() ?? '',
      flightNumber: (fd.get('flight_number') as string)?.trim() ?? '',
    })
    setStep(3)
  }

  // ─── PASO 4: Confirmar ────────────────────────────────────────────────────

  function handleConfirm() {
    if (!selectedQuote) return
    setError('')

    startTransition(async () => {
      const result = await createPublicBookingAction({
        quoteId:             selectedQuote.quoteId,
        slug:                company.slug,
        bookingType:         routeData.bookingType,
        passengerName:       passengerData.name,
        passengerPhone:      passengerData.phone,
        passengerEmail:      passengerData.email || undefined,
        passengerCount:      passengerData.count,
        specialInstructions: passengerData.instructions || undefined,
        flightNumber:        passengerData.flightNumber || undefined,
        scheduledAt:         routeData.scheduledAt,
        pickupAddress:       routeData.pickupAddress,
        pickupLat:           routeData.pickupLat,
        pickupLng:           routeData.pickupLng,
        dropoffAddress:      routeData.dropoffAddress,
        dropoffLat:          routeData.dropoffLat,
        dropoffLng:          routeData.dropoffLng,
      })

      if (!result.success || !result.data) {
        setError(result.error ?? 'Error al crear reservación')
        return
      }

      setConfirmation(result.data)
    })
  }

  // ─── Pago online (post-confirmación) ─────────────────────────────────────

  function handlePayOnline() {
    if (!confirmation) return
    setError('')
    startTransition(async () => {
      const result = await createPublicCheckoutAction(company.slug, confirmation.bookingId)
      if (!result.success || !result.data) {
        setError(result.error ?? 'No se pudo iniciar el pago online')
        return
      }
      window.location.href = result.data.url
    })
  }

  // ─── ÉXITO ────────────────────────────────────────────────────────────────

  if (confirmation) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✓
        </div>
        <h2 className="font-semibold text-2xl text-[#1d1d1f]">¡Reservación confirmada!</h2>
        <p className="text-gray-500">Tu número de reservación es:</p>
        <p className="font-mono text-2xl font-bold text-[#0071e3] bg-blue-50 rounded-2xl px-8 py-4 inline-block">
          {confirmation.bookingNumber}
        </p>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Un representante de {company.name} se comunicará contigo para confirmar los detalles.
        </p>
        {onlinePaymentsEnabled && (
          <div className="pt-2 space-y-2">
            <button
              onClick={handlePayOnline}
              disabled={isPending}
              className="px-8 py-3.5 bg-[#0071e3] text-white font-semibold rounded-2xl hover:bg-[#0077ed] disabled:opacity-50 transition-colors text-sm"
            >
              {isPending ? 'Redirigiendo…' : '💳 Pagar online ahora'}
            </button>
            <p className="text-xs text-gray-400">Pago seguro procesado por Stripe</p>
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 max-w-sm mx-auto">
                {error}
              </p>
            )}
          </div>
        )}
        {(company.phone || company.email) && (
          <div className="text-sm text-gray-500 space-y-1 pt-2">
            {company.phone && <p>📞 {company.phone}</p>}
            {company.email && <p>✉️ {company.email}</p>}
          </div>
        )}
      </div>
    )
  }

  // ─── LAYOUT BASE ─────────────────────────────────────────────────────────

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">
          Reservar con {company.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Servicio de transporte premium</p>
      </div>

      <StepIndicator current={step} />

      {/* ─── PASO 0: Ruta ──────────────────────────────────────────────────── */}
      {step === 0 && (
        <form onSubmit={handleRouteSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Tipo de servicio
            </label>
            <select
              name="booking_type"
              defaultValue="one_way"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
            >
              <option value="one_way">Solo ida</option>
              <option value="airport_pickup">Pickup aeropuerto</option>
              <option value="airport_dropoff">Dropoff aeropuerto</option>
              <option value="round_trip">Ida y vuelta</option>
              <option value="hourly">Por hora</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              name="scheduled_at"
              required
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Pickup — ¿Dónde te recogemos?
            </label>
            <AddressInput
              name="pickup"
              placeholder="Dirección de recogida..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Destino — ¿A dónde vas?
            </label>
            <AddressInput
              name="dropoff"
              placeholder="Dirección de destino..."
              required
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-[#0071e3] text-white font-semibold rounded-2xl hover:bg-[#0077ed] disabled:opacity-50 transition-colors text-sm"
          >
            {isPending ? 'Calculando precios...' : 'Ver vehículos disponibles →'}
          </button>
        </form>
      )}

      {/* ─── PASO 1: Vehículo ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-base">📍</span>
              <div>
                <p className="font-medium text-[#1d1d1f]">{routeData.pickupAddress}</p>
                <p className="text-gray-400">→ {routeData.dropoffAddress}</p>
                {vehicleQuotes[0]?.distanceMiles != null && (
                  <p className="text-xs text-gray-400 mt-1">
                    {vehicleQuotes[0].distanceMiles.toFixed(1)} mi · {vehicleQuotes[0].durationMinutes} min est.
                  </p>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm font-medium text-[#1d1d1f]">Selecciona tu vehículo:</p>

          <div className="space-y-3">
            {vehicleQuotes.map((q) => (
              <button
                key={q.vehicleType.id}
                onClick={() => handleSelectVehicle(q)}
                disabled={q.noPrice}
                className={`w-full text-left bg-white border rounded-2xl p-4 transition-all ${
                  q.noPrice
                    ? 'border-gray-200 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-[#0071e3] hover:shadow-sm cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{CLASS_ICONS[q.vehicleType.class] ?? '🚗'}</span>
                    <div>
                      <p className="font-semibold text-[#1d1d1f]">{q.vehicleType.name}</p>
                      <p className="text-xs text-gray-500">
                        Hasta {q.vehicleType.capacity} pasajeros
                        {q.vehicleType.amenities.length > 0 && (
                          <> · {q.vehicleType.amenities.slice(0, 2).join(', ')}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {q.noPrice ? (
                      <p className="text-xs text-gray-400">Sin precio</p>
                    ) : (
                      <>
                        <p className="font-bold text-xl text-[#1d1d1f]">
                          ${q.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">{q.currency}</p>
                        {q.surchargeAmount > 0 && (
                          <p className="text-xs text-gray-400">
                            incl. recargo ${q.surchargeAmount.toFixed(2)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => { setStep(0); setError('') }}
            className="text-sm text-gray-500 hover:text-[#0071e3] mt-2"
          >
            ← Cambiar ruta
          </button>
        </div>
      )}

      {/* ─── PASO 2: Pasajero ──────────────────────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handlePassengerSubmit} className="space-y-5">
          {selectedQuote && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CLASS_ICONS[selectedQuote.vehicleType.class] ?? '🚗'}</span>
                <p className="font-semibold text-[#1d1d1f] text-sm">{selectedQuote.vehicleType.name}</p>
              </div>
              <p className="font-bold text-lg text-[#1d1d1f]">
                ${selectedQuote.totalAmount.toFixed(2)} {selectedQuote.currency}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Juan Pérez"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="+1 809 000 0000"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Email <span className="font-normal normal-case text-gray-400">(opcional)</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="juan@example.com"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Número de pasajeros
            </label>
            <input
              type="number"
              name="count"
              defaultValue={1}
              min={1}
              max={selectedQuote?.vehicleType.capacity ?? 20}
              className="w-28 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
            />
          </div>

          {(routeData.bookingType === 'airport_pickup' || routeData.bookingType === 'airport_dropoff') && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                Número de vuelo <span className="font-normal normal-case text-gray-400">(recomendado)</span>
              </label>
              <input
                type="text"
                name="flight_number"
                placeholder="AA1234"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Instrucciones especiales <span className="font-normal normal-case text-gray-400">(opcional)</span>
            </label>
            <textarea
              name="instructions"
              rows={2}
              placeholder="Silla de bebé, equipaje extra, acceso especial..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 resize-none"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setStep(1); setError('') }}
              className="px-5 py-3 border border-gray-200 text-sm font-medium rounded-xl hover:border-[#0071e3] transition-colors text-[#1d1d1f]"
            >
              ← Volver
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#0071e3] text-white font-semibold rounded-2xl hover:bg-[#0077ed] transition-colors text-sm"
            >
              Continuar →
            </button>
          </div>
        </form>
      )}

      {/* ─── PASO 3: Confirmación ──────────────────────────────────────────── */}
      {step === 3 && selectedQuote && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Resumen de tu reservación
            </p>

            {/* Ruta */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="text-gray-400 w-14 shrink-0">Pickup</span>
                <span className="text-[#1d1d1f] font-medium">{routeData.pickupAddress}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-14 shrink-0">Destino</span>
                <span className="text-[#1d1d1f] font-medium">{routeData.dropoffAddress}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-14 shrink-0">Fecha</span>
                <span className="text-[#1d1d1f]">
                  {new Date(routeData.scheduledAt).toLocaleString('es-DO', {
                    dateStyle: 'medium', timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex gap-2">
                <span className="text-gray-400 w-14 shrink-0">Vehículo</span>
                <span className="text-[#1d1d1f]">{selectedQuote.vehicleType.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-14 shrink-0">Pasajero</span>
                <span className="text-[#1d1d1f]">{passengerData.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-14 shrink-0">Tel.</span>
                <span className="text-[#1d1d1f]">{passengerData.phone}</span>
              </div>
              {passengerData.count > 1 && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-14 shrink-0">Pax</span>
                  <span className="text-[#1d1d1f]">{passengerData.count}</span>
                </div>
              )}
              {passengerData.instructions && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-14 shrink-0">Notas</span>
                  <span className="text-[#1d1d1f]">{passengerData.instructions}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[#1d1d1f]">Total a pagar</span>
                <span className="font-bold text-2xl text-[#1d1d1f]">
                  ${selectedQuote.totalAmount.toFixed(2)}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    {selectedQuote.currency}
                  </span>
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">Pago al conductor</p>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(2); setError('') }}
              className="px-5 py-3 border border-gray-200 text-sm font-medium rounded-xl hover:border-[#0071e3] transition-colors text-[#1d1d1f]"
            >
              ← Volver
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 py-3.5 bg-[#0071e3] text-white font-semibold rounded-2xl hover:bg-[#0077ed] disabled:opacity-50 transition-colors text-sm"
            >
              {isPending ? 'Confirmando...' : '✓ Confirmar reservación'}
            </button>
          </div>

          <p className="text-xs text-center text-gray-400">
            Al confirmar, recibirás un número de reservación. Un agente se comunicará contigo para coordinar el pago.
          </p>
        </div>
      )}
    </div>
  )
}
