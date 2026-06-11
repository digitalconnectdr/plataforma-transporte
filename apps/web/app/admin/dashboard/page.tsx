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
  let revenue = { month: 0, today: 0 }
  let recentBookings: { id: string; booking_number: string; status: string; passenger_name: string | null; scheduled_at: string; total_amount: number | null }[] = []
  let upcomingBookings: { id: string; booking_number: string; status: string; passenger_name: string | null; scheduled_at: string }[] = []
  let weekTrend: { day: string; count: number }[] = []

  if (companyId) {
    const admin = createAdminClient()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const next24h = new Date(Date.now() + 24 * 3_600_000)
    const weekAgo = new Date(todayStart.getTime() - 6 * 24 * 3_600_000)

    const activeStatuses = ['pending', 'assigned', 'en_route', 'arrived', 'in_progress'] as const

    // Counts vía head:true — no se transfieren filas, solo el conteo.
    // Las únicas filas que viajan están acotadas (mes actual / 7 días / top N).
    const [
      { count: vehiclesCount },
      { count: vehiclesAvailCount },
      { count: driversAvailCount },
      { count: pendingCount },
      { count: activeCount },
      { count: todayCount },
      { data: completedMonth },
      { data: weekRows },
      { data: recent },
      { data: upcoming },
    ] = await Promise.all([
      admin.from('vehicles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      admin.from('vehicles').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'available'),
      admin.from('drivers').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_available', true),
      admin.from('bookings').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending'),
      admin.from('bookings').select('id', { count: 'exact', head: true }).eq('company_id', companyId).in('status', activeStatuses),
      admin.from('bookings').select('id', { count: 'exact', head: true }).eq('company_id', companyId).gte('scheduled_at', todayStart.toISOString()),
      admin
        .from('bookings')
        .select('total_amount, completed_at')
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .gte('completed_at', monthStart.toISOString()),
      admin
        .from('bookings')
        .select('created_at')
        .eq('company_id', companyId)
        .gte('created_at', weekAgo.toISOString()),
      admin
        .from('bookings')
        .select('id, booking_number, status, passenger_name, scheduled_at, total_amount')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5),
      admin
        .from('bookings')
        .select('id, booking_number, status, passenger_name, scheduled_at')
        .eq('company_id', companyId)
        .in('status', ['pending', 'assigned', 'en_route', 'arrived'])
        .gte('scheduled_at', new Date().toISOString())
        .lte('scheduled_at', next24h.toISOString())
        .order('scheduled_at')
        .limit(6),
    ])

    stats = {
      vehicles:     vehiclesCount ?? 0,
      driversAvail: driversAvailCount ?? 0,
      fleet:        vehiclesAvailCount ?? 0,
    }

    bookingStats = {
      pending:        pendingCount ?? 0,
      active:         activeCount ?? 0,
      today:          todayCount ?? 0,
      completedMonth: completedMonth?.length ?? 0,
    }

    revenue = {
      month: (completedMonth ?? []).reduce((s, b) => s + Number(b.total_amount ?? 0), 0),
      today: (completedMonth ?? [])
        .filter((b) => b.completed_at && new Date(b.completed_at) >= todayStart)
        .reduce((s, b) => s + Number(b.total_amount ?? 0), 0),
    }

    // Tendencia: reservaciones creadas por día, últimos 7 días
    const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    weekTrend = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(weekAgo.getTime() + i * 24 * 3_600_000)
      const dayEnd = new Date(dayStart.getTime() + 24 * 3_600_000)
      return {
        day: DAY_LABELS[dayStart.getDay()],
        count: (weekRows ?? []).filter((b) => {
          const created = new Date(b.created_at)
          return created >= dayStart && created < dayEnd
        }).length,
      }
    })

    recentBookings = recent ?? []
    upcomingBookings = upcoming ?? []
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

      {/* Revenue (F1.12) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-sl-surface-high border border-sl-outline-variant rounded-2xl p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
            Ingresos del mes (completados)
          </p>
          <p className="text-4xl font-playfair font-semibold text-sl-on-surface mt-2">
            ${revenue.month.toFixed(2)}
          </p>
        </div>
        <div className="bg-sl-surface-high border border-sl-outline-variant rounded-2xl p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
            Ingresos de hoy
          </p>
          <p className="text-4xl font-playfair font-semibold text-sl-on-surface mt-2">
            ${revenue.today.toFixed(2)}
          </p>
        </div>
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

      {/* Tendencia 7 días + Próximos viajes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tendencia */}
        <div className="bg-sl-surface-high border border-sl-outline-variant rounded-2xl p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-4">
            Reservaciones — últimos 7 días
          </p>
          <div className="flex items-end justify-between gap-2 h-28">
            {weekTrend.map((d, i) => {
              const max = Math.max(1, ...weekTrend.map((x) => x.count))
              const h = Math.round((d.count / max) * 100)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-sl-on-surface-muted">{d.count || ''}</span>
                  <div
                    className="w-full rounded-t-md bg-gold/80 min-h-[3px] transition-all"
                    style={{ height: `${Math.max(3, h)}%` }}
                  />
                  <span className="text-[10px] text-sl-on-surface-muted">{d.day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Próximos viajes */}
        <div className="bg-sl-surface-high border border-sl-outline-variant rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-sl-outline-variant">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
              Próximas 24 horas
            </p>
          </div>
          {upcomingBookings.length === 0 ? (
            <p className="p-6 text-sm text-sl-on-surface-muted text-center">
              Sin viajes programados.
            </p>
          ) : (
            <div className="divide-y divide-sl-outline-variant">
              {upcomingBookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/bookings/${b.id}`}
                  className="flex items-center justify-between px-5 py-2.5 hover:bg-sl-bg/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-[#0071e3] shrink-0">{b.booking_number}</span>
                    <span className="text-xs text-sl-on-surface-muted truncate">{b.passenger_name ?? '—'}</span>
                  </div>
                  <span className="text-xs font-medium text-sl-on-surface shrink-0">
                    {new Date(b.scheduled_at).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
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
