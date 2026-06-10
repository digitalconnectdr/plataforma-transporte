import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Dashboard | LuxeRide' }

export default async function AdminDashboardPage() {
  const user = await requireRole(
    'super_admin',
    'company_owner',
    'company_admin',
    'dispatcher',
    'accounting'
  )

  const companyId = user.company_id

  // Fetch fleet + driver + booking stats
  let stats = { vehicles: 0, driversAvail: 0, fleet: 0 }
  let bookingStats = { pending: 0, active: 0, today: 0, completedMonth: 0 }
  let recentBookings: { id: string; booking_number: string; status: string; passenger_name: string | null; scheduled_at: string; total_amount: number | null }[] = []

  if (companyId) {
    const admin = createAdminClient()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const [
      { data: vehicles },
      { data: drivers },
      { data: bookings },
      { data: recent },
    ] = await Promise.all([
      admin.from('vehicles').select('id, status').eq('company_id', companyId),
      admin.from('drivers').select('id, is_available').eq('company_id', companyId),
      admin.from('bookings').select('id, status, scheduled_at, completed_at').eq('company_id', companyId),
      admin
        .from('bookings')
        .select('id, booking_number, status, passenger_name, scheduled_at, total_amount')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    stats = {
      vehicles:     vehicles?.length ?? 0,
      driversAvail: drivers?.filter((d) => d.is_available).length ?? 0,
      fleet:        vehicles?.filter((v) => v.status === 'available').length ?? 0,
    }

    const activeStatuses = ['pending', 'assigned', 'en_route', 'arrived', 'in_progress']
    bookingStats = {
      pending:        bookings?.filter((b) => b.status === 'pending').length ?? 0,
      active:         bookings?.filter((b) => activeStatuses.includes(b.status)).length ?? 0,
      today:          bookings?.filter((b) => new Date(b.scheduled_at) >= todayStart).length ?? 0,
      completedMonth: bookings?.filter((b) => b.status === 'completed' && b.completed_at && new Date(b.completed_at) >= monthStart).length ?? 0,
    }

    recentBookings = recent ?? []
  }

  const STATUS_COLORS: Record<string, string> = {
    pending:     'bg-yellow-100 text-yellow-700',
    assigned:    'bg-blue-100 text-[#0071e3]',
    en_route:    'bg-indigo-100 text-indigo-700',
    arrived:     'bg-purple-100 text-purple-700',
    in_progress: 'bg-orange-100 text-orange-700',
    completed:   'bg-green-100 text-green-700',
    cancelled:   'bg-red-100 text-red-600',
    no_show:     'bg-red-100 text-red-600',
  }
  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente', assigned: 'Asignado', en_route: 'En ruta',
    arrived: 'Llegó', in_progress: 'En viaje', completed: 'Completado',
    cancelled: 'Cancelado', no_show: 'No apareció',
  }

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-playfair text-3xl font-semibold text-sl-on-surface">Dashboard</h1>
        <p className="text-sm text-sl-on-surface-muted mt-1">
          Bienvenido, {user.profile.first_name} —{' '}
          <span className="text-gold">{user.role.replace(/_/g, ' ')}</span>
        </p>
      </div>

      {/* Fleet + driver cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Vehículos en flota', value: stats.vehicles,     href: '/admin/fleet'   },
          { label: 'Disponibles ahora',  value: stats.fleet,        href: '/admin/fleet'   },
          { label: 'Conductores activos', value: stats.driversAvail, href: '/admin/drivers' },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-sl-surface-high border border-sl-outline-variant rounded-2xl p-6 hover:border-gold/30 transition-colors group"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
              {card.label}
            </p>
            <p className="text-4xl font-playfair font-semibold text-sl-on-surface mt-2 group-hover:text-gold transition-colors">
              {companyId ? card.value : '—'}
            </p>
          </Link>
        ))}
      </div>

      {/* Booking stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pendientes',       value: bookingStats.pending,        href: '/admin/bookings?status=pending' },
          { label: 'Activas',          value: bookingStats.active,         href: '/admin/bookings' },
          { label: 'Hoy',              value: bookingStats.today,          href: '/admin/bookings' },
          { label: 'Completadas (mes)', value: bookingStats.completedMonth, href: '/admin/bookings?status=completed' },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-sl-surface-high border border-sl-outline-variant rounded-2xl p-5 hover:border-[#0071e3]/30 transition-colors group"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
              {card.label}
            </p>
            <p className="text-3xl font-playfair font-semibold text-sl-on-surface mt-2 group-hover:text-[#0071e3] transition-colors">
              {companyId ? card.value : '—'}
            </p>
          </Link>
        ))}
      </div>

      {/* Reservaciones recientes */}
      <div className="bg-sl-surface-high border border-sl-outline-variant rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sl-outline-variant">
          <p className="text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted">
            Reservaciones recientes
          </p>
          <Link href="/admin/bookings" className="text-xs text-[#0071e3] hover:underline">
            Ver todas →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-sl-on-surface-muted">No hay reservaciones aún.</p>
            <Link
              href="/admin/bookings/new"
              className="mt-2 inline-block text-sm text-[#0071e3] hover:underline"
            >
              Crear primera reservación →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-sl-outline-variant">
            {recentBookings.map((b) => (
              <Link
                key={b.id}
                href={`/admin/bookings/${b.id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-sl-bg/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#0071e3]">{b.booking_number}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-sl-on-surface-muted">{b.passenger_name ?? '—'}</span>
                  <span className="font-semibold text-sl-on-surface">
                    {b.total_amount != null ? `$${Number(b.total_amount).toFixed(2)}` : '—'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
