import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import { logoutAction } from '@/app/actions/auth'
import { NavLink } from '@/components/admin/nav-link'
import { MapsProvider } from '@/components/maps/maps-provider'
import { getLocale, getDict } from '@/lib/i18n/server'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'

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
    try {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('companies')
        .select('name')
        .eq('id', user.company_id)
        .single()
      if (error) {
        console.error('[admin/layout] companies query error:', JSON.stringify(error))
      } else if (data?.name) {
        companyName = data.name
      }
    } catch (err) {
      console.error('[admin/layout] companies query THREW:', err)
    }
  }

  const isOwner        = user.role === 'company_owner'
  const isOwnerOrAdmin = isOwner || user.role === 'company_admin'
  const isDispatcher   = user.role === 'dispatcher'
  const isAccounting   = user.role === 'accounting'

  const locale = getLocale()
  const nav = getDict(locale).adminNav

  return (
    <div className="min-h-screen bg-sl-bg flex">
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-sl-surface-high border-r border-sl-outline-variant flex flex-col shrink-0">
        {/* Company wordmark */}
        <div className="px-5 py-5 border-b border-sl-outline-variant">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center shrink-0">
              <span className="text-gray-900 font-bold text-[10px] leading-none">L</span>
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
            {nav.overview}
          </p>
          <NavLink href="/admin/dashboard" label={nav.dashboard} />

          {/* OPERATIONS */}
          {(isOwnerOrAdmin || isDispatcher) && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
                {nav.operations}
              </p>
              <NavLink href="/dispatcher/dashboard" label={nav.dispatch} />
              <NavLink href="/admin/fleet"   label={nav.fleet}   />
              <NavLink href="/admin/drivers" label={nav.drivers} />
            </>
          )}

          {/* GEOGRAPHY */}
          {(isOwnerOrAdmin || isDispatcher) && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
                {nav.geography}
              </p>
              <NavLink href="/admin/zones"    label={nav.zones} />
              <NavLink href="/admin/airports" label={nav.airports} />
            </>
          )}

          {/* PRICING */}
          {isOwnerOrAdmin && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
                {nav.pricing}
              </p>
              <NavLink href="/admin/pricing" label={nav.pricingRules} />
            </>
          )}

          {/* BOOKINGS */}
          {(isOwnerOrAdmin || isDispatcher) && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
                {nav.bookings}
              </p>
              <NavLink href="/admin/bookings" label={nav.reservations} />
            </>
          )}

          {/* FINANCE */}
          {(isOwnerOrAdmin || isAccounting) && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
                {nav.finance}
              </p>
              <NavLink href="/admin/reports" label={nav.reports} />
              <NavLink href="/admin/audit"   label={nav.auditLog} />
            </>
          )}

          {/* MANAGEMENT */}
          {isOwnerOrAdmin && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sl-on-surface-muted">
                {nav.management}
              </p>
              <NavLink href="/admin/corporate" label={nav.corporate} />
              <NavLink href="/admin/team" label={nav.team} />
              {isOwner && <NavLink href="/admin/settings" label={nav.settings} />}
            </>
          )}

        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-sl-outline-variant">
          <p className="text-xs font-medium text-sl-on-surface truncate">
            {user.profile.first_name} {user.profile.last_name}
          </p>
          <p className="text-[11px] text-sl-on-surface-muted truncate mt-0.5">{user.email}</p>
          <div className="mt-2">
            <LanguageSwitcher current={locale} variant="light" />
          </div>
          <form action={logoutAction} className="mt-2">
            <button
              type="submit"
              className="text-[11px] text-sl-on-surface-muted hover:text-red-400 transition-colors"
            >
              Sign out →
            </button>
          </form>
          <p className="mt-3 pt-3 border-t border-sl-outline-variant text-[9px] uppercase tracking-[0.18em] text-sl-on-surface-muted/70">
            LuxeRide · Powered by
            <span className="block text-gold/80">JPRS Digital Connect</span>
          </p>
        </div>
      </aside>

      {/* ── Main — envuelto en MapsProvider para toda la sección admin ── */}
      <main className="flex-1 overflow-auto">
        <MapsProvider>{children}</MapsProvider>
      </main>
    </div>
  )
}
