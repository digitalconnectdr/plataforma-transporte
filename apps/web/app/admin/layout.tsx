import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import { logoutAction } from '@/app/actions/auth'
import { NavLink } from '@/components/admin/nav-link'
import { MapsProvider } from '@/components/maps/maps-provider'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole(
    'super_admin',
    'company_owner',
    'company_admin',
    'dispatcher',
    'accounting',
  )

  // Fetch company name for sidebar header
  let companyName = 'Dashboard'
  if (user.company_id) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('companies')
      .select('name')
      .eq('id', user.company_id)
      .single()
    if (data?.name) companyName = data.name
  }

  const isOwner        = user.role === 'company_owner'
  const isOwnerOrAdmin = isOwner || user.role === 'company_admin'
  const isDispatcher   = user.role === 'dispatcher'

  return (
    <div className="min-h-screen bg-sl-bg flex">
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-sl-surface-high border-r border-sl-outline-variant flex flex-col shrink-0">
        {/* Company wordmark */}
        <div className="px-5 py-5 border-b border-sl-outline-variant">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center shrink-0">
              <span className="text-sl-bg font-bold text-[10px] leading-none">L</span>
            </div>
            <span className="font-playfair text-sm font-semibold text-sl-on-surface truncate">
              {companyName}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-sl-on-surface-muted capitalize pl-8">
            {user.role.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">

          {/* OVERVIEW */}
          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
            Overview
          </p>
          <NavLink href="/admin/dashboard" label="Dashboard" />

          {/* OPERATIONS */}
          {(isOwnerOrAdmin || isDispatcher) && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
                Operations
              </p>
              <NavLink href="/admin/fleet"   label="Fleet"   />
              <NavLink href="/admin/drivers" label="Drivers" />
            </>
          )}

          {/* GEOGRAPHY */}
          {(isOwnerOrAdmin || isDispatcher) && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
                Geography
              </p>
              <NavLink href="/admin/zones"    label="Service Zones" />
              <NavLink href="/admin/airports" label="Airports"      />
            </>
          )}

          {/* PRICING */}
          {isOwnerOrAdmin && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
                Pricing
              </p>
              <NavLink href="/admin/pricing" label="Pricing Rules" />
            </>
          )}

          {/* BOOKINGS */}
          {(isOwnerOrAdmin || isDispatcher) && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
                Bookings
              </p>
              <NavLink href="/admin/bookings" label="Reservaciones" />
            </>
          )}

          {/* MANAGEMENT */}
          {isOwnerOrAdmin && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
                Management
              </p>
              <NavLink href="/admin/team" label="Team" />
              {isOwner && <NavLink href="/admin/settings" label="Settings" />}
            </>
          )}

        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-sl-outline-variant">
          <p className="text-xs font-medium text-sl-on-surface truncate">
            {user.profile.first_name} {user.profile.last_name}
          </p>
          <p className="text-[11px] text-sl-on-surface-muted truncate mt-0.5">{user.email}</p>
          <form action={logoutAction} className="mt-2">
            <button
              type="submit"
              className="text-[11px] text-sl-on-surface-muted hover:text-red-400 transition-colors"
            >
              Sign out →
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main — envuelto en MapsProvider para toda la sección admin ── */}
      <main className="flex-1 overflow-auto">
        <MapsProvider>{children}</MapsProvider>
      </main>
    </div>
  )
}
