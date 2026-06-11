'use client'
// ── Nueva Reservación — Formulario de 2 fases ──────────────────────────────────
// Fase 1: Ruta + vehículo + fecha → calcular precio
// Fase 2: Info del pasajero → confirmar reservación

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AddressInput } from '@/components/maps/address-input'
import { calculateQuoteAction, createBookingAction } from '@/app/actions/bookings'
import type { QuoteResult } from '@/app/actions/bookings'

interface VehicleType {
  id: string
  name: string
  class: string
  capacity: number
}

interface Driver {
  id: string
  first_name: string
  last_name: string
}

interface CorporateAccount {
  id: string
  name: string
}

interface Props {
  vehicleTypes: VehicleType[]
  drivers: Driver[]
  corporateAccounts?: CorporateAccount[]
}

const BOOKING_TYPE_LABELS = [
  { value: 'one_way',         label: 'Solo ida' },
  { value: 'airport_pickup',  label: 'Pickup aeropuerto' },
  { value: 'airport_dropoff', label: 'Dropoff aeropuerto' },
  { value: 'round_trip',      label: 'Ida y vuelta' },
  { value: 'hourly',          label: 'Por hora' },
]

export function NewBookingForm({ vehicleTypes, drivers, corporateAccounts = [] }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [phase, setPhase] = useState<'route' | 'passenger'>('route')
  const [quote, setQuote]  = useState<QuoteResult | null>(null)
  const [error, setError]  = useState('')
  const [success, setSuccess] = useState('')

  // Guardamos los valores del formulario de ruta para pasarlos al createBookingAction
  const [routeFormData, setRouteFormData] = useState<FormData | null>(null)

  // ── Fase 1: Calcular precio ───────────────────────────────────────────────────

  async function handleCalculatePrice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    setRouteFormData(fd)

    startTransition(async () => {
      const result = await calculateQuoteAction(fd)
      if (!result.success || !result.data) {
        setError(result.error ?? 'Error al calcular precio')
        return
      }
      setQuote(result.data)
      setPhase('passenger')
    })
  }

  // ── Fase 2: Crear reservación ─────────────────────────────────────────────────

  async function handleCreateBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!quote || !routeFormData) return
    setError('')

    const passengerFd = new FormData(e.currentTarget)
    // Combinar datos de ruta + pasajero + quote_id
    const combined = new FormData()
    for (const [k, v] of routeFormData.entries()) combined.set(k, v)
    for (const [k, v] of passengerFd.entries()) combined.set(k, v)
    combined.set('quote_id', quote.quoteId)

    startTransition(async () => {
      const result = await createBookingAction(combined)
      if (!result.success || !result.data) {
        setError(result.error ?? 'Error al crear reservación')
        return
      }
      setSuccess(`Reservación ${result.data.bookingNumber} creada con éxito`)
      setTimeout(() => router.push(`/admin/bookings/${result.data!.bookingId}`), 1500)
    })
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <p className="text-green-700 font-semibold text-lg">{success}</p>
        <p className="text-sm text-green-600 mt-1">Redirigiendo al detalle...</p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FASE 1: Ruta
  // ─────────────────────────────────────────────────────────────────────────────

  if (phase === 'route') {
    return (
      <form onSubmit={handleCalculatePrice} className="space-y-5">

        {/* Tipo de reservación */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
            Tipo de servicio
          </label>
          <select
            name="booking_type"
            defaultValue="one_way"
            className="w-full rounded-xl border border-sl-outline-variant bg-white px-4 py-2.5 text-sm text-sl-on-surface focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
          >
            {BOOKING_TYPE_LABELS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Vehículo */}
        {vehicleTypes.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
              Tipo de vehículo
            </label>
            <select
              name="vehicle_type_id"
              className="w-full rounded-xl border border-sl-outline-variant bg-white px-4 py-2.5 text-sm text-sl-on-surface focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
            >
              <option value="">— Cualquier tipo —</option>
              {vehicleTypes.map((vt) => (
                <option key={vt.id} value={vt.id}>
                  {vt.name} ({vt.class}, {vt.capacity} pax)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Fecha y hora */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
            Fecha y hora del servicio
          </label>
          <input
            type="datetime-local"
            name="scheduled_at"
            required
            min={new Date().toISOString().slice(0, 16)}
            className="w-full rounded-xl border border-sl-outline-variant bg-white px-4 py-2.5 text-sm text-sl-on-surface focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
          />
        </div>

        {/* Pickup */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
            Pickup — Dirección de recogida
          </label>
          <AddressInput
            name="pickup"
            placeholder="Ingresa la dirección de pickup..."
            required
          />
          <p className="mt-1 text-[11px] text-sl-on-surface-muted">
            Selecciona una sugerencia del dropdown para guardar las coordenadas
          </p>
        </div>

        {/* Dropoff */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
            Dropoff — Dirección de destino
          </label>
          <AddressInput
            name="dropoff"
            placeholder="Ingresa la dirección de destino..."
            required
          />
        </div>

        {/* Número de vuelo (solo para airport) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
            Número de vuelo <span className="font-normal normal-case">(opcional)</span>
          </label>
          <input
            type="text"
            name="flight_number"
            placeholder="AA1234"
            className="w-full rounded-xl border border-sl-outline-variant bg-white px-4 py-2.5 text-sm text-sl-on-surface focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-[#0071e3] text-white font-semibold rounded-xl hover:bg-[#0077ed] disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Calculando precio...' : 'Calcular precio →'}
        </button>
      </form>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FASE 2: Datos del pasajero
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Resumen del precio */}
      {quote && (
        <div className="bg-sl-surface-high border border-sl-outline-variant rounded-2xl p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-3">
            Resumen del precio
          </p>
          <div className="space-y-1.5 text-sm">
            {quote.distanceMiles != null && (
              <div className="flex justify-between">
                <span className="text-sl-on-surface-muted">Distancia</span>
                <span className="text-sl-on-surface">{quote.distanceMiles.toFixed(1)} mi</span>
              </div>
            )}
            {quote.durationMinutes != null && (
              <div className="flex justify-between">
                <span className="text-sl-on-surface-muted">Duración est.</span>
                <span className="text-sl-on-surface">{quote.durationMinutes} min</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sl-on-surface-muted">Tarifa base</span>
              <span className="text-sl-on-surface">${quote.baseAmount.toFixed(2)}</span>
            </div>
            {quote.surchargeAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-sl-on-surface-muted">Recargo</span>
                <span className="text-sl-on-surface">+${quote.surchargeAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-sl-outline-variant pt-2 mt-2">
              <span className="font-semibold text-sl-on-surface">Total</span>
              <span className="font-bold text-xl text-sl-on-surface">
                ${quote.totalAmount.toFixed(2)} {quote.currency}
              </span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleCreateBooking} className="space-y-5">

        {/* Nombre */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
            Nombre del pasajero <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="passenger_name"
            required
            placeholder="Juan Pérez"
            className="w-full rounded-xl border border-sl-outline-variant bg-white px-4 py-2.5 text-sm text-sl-on-surface focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            name="passenger_phone"
            placeholder="+1 809 000 0000"
            className="w-full rounded-xl border border-sl-outline-variant bg-white px-4 py-2.5 text-sm text-sl-on-surface focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
            Email <span className="font-normal normal-case">(opcional)</span>
          </label>
          <input
            type="email"
            name="passenger_email"
            placeholder="juan@example.com"
            className="w-full rounded-xl border border-sl-outline-variant bg-white px-4 py-2.5 text-sm text-sl-on-surface focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
          />
        </div>

        {/* Pasajeros */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
            Número de pasajeros
          </label>
          <input
            type="number"
            name="passenger_count"
            defaultValue={1}
            min={1}
            max={20}
            className="w-28 rounded-xl border border-sl-outline-variant bg-white px-4 py-2.5 text-sm text-sl-on-surface focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
          />
        </div>

        {/* Cuenta corporativa (F1.11) */}
        {corporateAccounts.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
              Cuenta corporativa <span className="font-normal normal-case">(opcional — factura a crédito)</span>
            </label>
            <select
              name="corporate_account_id"
              defaultValue=""
              className="w-full rounded-xl border border-sl-outline-variant bg-white px-4 py-2.5 text-sm text-sl-on-surface focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
            >
              <option value="">— Cliente particular —</option>
              {corporateAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Instrucciones especiales */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
            Instrucciones especiales <span className="font-normal normal-case">(opcional)</span>
          </label>
          <textarea
            name="special_instructions"
            rows={2}
            placeholder="Silla de bebé, equipaje extra..."
            className="w-full rounded-xl border border-sl-outline-variant bg-white px-4 py-2.5 text-sm text-sl-on-surface focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 resize-none"
          />
        </div>

        {/* Notas internas */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-2">
            Notas internas <span className="font-normal normal-case">(solo staff)</span>
          </label>
          <textarea
            name="internal_notes"
            rows={2}
            placeholder="Notas para el conductor o dispatcher..."
            className="w-full rounded-xl border border-sl-outline-variant bg-white px-4 py-2.5 text-sm text-sl-on-surface focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 resize-none"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setPhase('route'); setError('') }}
            className="px-5 py-3 border border-sl-outline-variant text-sm font-medium rounded-xl hover:border-[#0071e3] transition-colors text-sl-on-surface"
          >
            ← Volver
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-3 bg-[#0071e3] text-white font-semibold rounded-xl hover:bg-[#0077ed] disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Creando reservación...' : 'Confirmar reservación'}
          </button>
        </div>
      </form>
    </div>
  )
}
