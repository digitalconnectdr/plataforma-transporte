import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { AutoRefresh } from './auto-refresh'

export const metadata: Metadata = { title: 'Seguimiento de viaje | LuxeRide' }
export const dynamic = 'force-dynamic'

// Página pública de tracking — el UUID del booking actúa como capability URL
// (no adivinable). No expone montos, notas internas ni datos del conductor
// más allá de nombre y vehículo.

const STATUS_FLOW = [
  { key: 'pending',     label: 'Reservación recibida' },
  { key: 'assigned',    label: 'Conductor asignado' },
  { key: 'en_route',    label: 'Conductor en camino' },
  { key: 'arrived',     label: 'Conductor en el punto de recogida' },
  { key: 'in_progress', label: 'Viaje en curso' },
  { key: 'completed',   label: 'Viaje completado' },
]

const TERMINAL_LABELS: Record<string, string> = {
  cancelled: 'Reservación cancelada',
  no_show: 'Pasajero no se presentó',
  failed: 'Viaje no completado',
}

function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

export default async function TrackPage({ params }: { params: { id: string } }) {
  if (!isValidUuid(params.id)) return notFound()

  const admin = createAdminClient()
  const { data: booking } = await admin
    .from('bookings')
    .select('id, booking_number, status, scheduled_at, pickup_location, dropoff_location, driver_id, vehicle_id, company_id, passenger_name')
    .eq('id', params.id)
    .single()

  if (!booking) return notFound()

  const [companyRes, driverRes, vehicleRes] = await Promise.all([
    admin.from('companies').select('name, phone, primary_color').eq('id', booking.company_id).single(),
    booking.driver_id
      ? admin.from('user_profiles').select('first_name').eq('id', booking.driver_id).single()
      : Promise.resolve({ data: null }),
    booking.vehicle_id
      ? admin.from('vehicles').select('make, model, color, plate_number').eq('id', booking.vehicle_id).single()
      : Promise.resolve({ data: null }),
  ])

  const company = companyRes.data
  const driver = driverRes.data as { first_name: string } | null
  const vehicle = vehicleRes.data as { make: string; model: string; color: string | null; plate_number: string } | null

  const pickup  = (booking.pickup_location as { address?: string } | null)?.address ?? '—'
  const dropoff = (booking.dropoff_location as { address?: string } | null)?.address ?? '—'

  const isTerminal = booking.status in TERMINAL_LABELS
  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === booking.status)
  const isActive = !isTerminal && booking.status !== 'completed'

  return (
    <div className="min-h-screen bg-[#141313] text-white">
      {isActive && <AutoRefresh seconds={30} />}

      <div className="max-w-md mx-auto px-5 py-10 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-[#e9c176] flex items-center justify-center mx-auto mb-3">
            <span className="text-gray-900 font-bold text-sm leading-none">L</span>
          </div>
          <h1 className="font-playfair text-xl font-semibold">{company?.name ?? 'LuxeRide'}</h1>
          <p className="font-mono text-sm text-[#e9c176] mt-2">{booking.booking_number}</p>
          <p className="text-xs text-white/40 mt-1">
            {new Date(booking.scheduled_at).toLocaleString('es-DO', {
              weekday: 'long', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>

        {/* Estado terminal (cancelado / no-show) */}
        {isTerminal ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
            <p className="font-semibold text-red-400">{TERMINAL_LABELS[booking.status]}</p>
            {company?.phone && (
              <p className="text-sm text-white/50 mt-2">
                ¿Preguntas? Llámanos: <a href={`tel:${company.phone}`} className="text-[#e9c176]">{company.phone}</a>
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Timeline */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <div className="space-y-0">
                {STATUS_FLOW.map((s, i) => {
                  const done = i < currentIdx
                  const current = i === currentIdx
                  return (
                    <div key={s.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-4 h-4 rounded-full shrink-0 mt-0.5 ${
                            done
                              ? 'bg-[#e9c176]'
                              : current
                                ? 'bg-[#e9c176] ring-4 ring-[#e9c176]/20 animate-pulse'
                                : 'bg-white/15'
                          }`}
                        />
                        {i < STATUS_FLOW.length - 1 && (
                          <div className={`w-0.5 h-8 ${done ? 'bg-[#e9c176]/60' : 'bg-white/10'}`} />
                        )}
                      </div>
                      <p
                        className={`text-sm pb-6 ${
                          current
                            ? 'font-semibold text-white'
                            : done
                              ? 'text-white/60'
                              : 'text-white/30'
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Conductor + vehículo */}
            {driver && (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-2">
                  Tu conductor
                </p>
                <p className="font-semibold">{driver.first_name}</p>
                {vehicle && (
                  <p className="text-sm text-white/50 mt-1">
                    {vehicle.color ? `${vehicle.color} ` : ''}{vehicle.make} {vehicle.model} ·{' '}
                    <span className="font-mono text-[#e9c176]">{vehicle.plate_number}</span>
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Ruta */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Pickup</p>
            <p className="text-white/80">{pickup}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Destino</p>
            <p className="text-white/80">{dropoff}</p>
          </div>
        </div>

        {company?.phone && !isTerminal && (
          <p className="text-center text-xs text-white/40">
            ¿Necesitas ayuda?{' '}
            <a href={`tel:${company.phone}`} className="text-[#e9c176] hover:underline">
              {company.phone}
            </a>
          </p>
        )}

        {isActive && (
          <p className="text-center text-[10px] text-white/25">
            Esta página se actualiza automáticamente cada 30 segundos.
          </p>
        )}
      </div>
    </div>
  )
}
