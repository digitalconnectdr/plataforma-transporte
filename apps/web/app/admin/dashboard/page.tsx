import { requireRole } from '@/lib/auth/session'
import { logoutAction } from '@/app/actions/auth'

export default async function AdminDashboardPage() {
  const user = await requireRole(
    'super_admin',
    'company_owner',
    'company_admin',
    'dispatcher',
    'accounting'
  )

  return (
    <div className="min-h-screen bg-sl-bg p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-playfair text-3xl font-semibold text-sl-on-surface">
              Dashboard
            </h1>
            <p className="text-sm text-sl-on-surface-muted mt-1">
              Welcome back, {user.profile.first_name} — <span className="text-gold">{user.role.replace('_', ' ')}</span>
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-sl-on-surface-muted hover:text-sl-on-surface border border-sl-outline-variant rounded-lg hover:border-gold/50 transition-all"
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Placeholder content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Active Bookings', value: '—', hint: 'F1.3 coming soon' },
            { label: 'Fleet Available', value: '—', hint: 'F1.3 coming soon' },
            { label: 'Drivers Online', value: '—', hint: 'F1.3 coming soon' },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-sl-surface-high border border-sl-outline-variant rounded-2xl p-6"
            >
              <p className="text-xs text-sl-on-surface-muted uppercase tracking-widest">{card.label}</p>
              <p className="text-3xl font-playfair font-semibold text-sl-on-surface mt-2">{card.value}</p>
              <p className="text-xs text-sl-on-surface-muted mt-1">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="bg-sl-surface-high border border-gold/20 rounded-2xl p-6">
          <p className="text-sm font-medium text-gold mb-1">✓ Auth + RBAC working</p>
          <p className="text-sm text-sl-on-surface-muted">
            Signed in as <strong className="text-sl-on-surface">{user.email}</strong> with role{' '}
            <strong className="text-sl-on-surface">{user.role}</strong>.
            Company ID: <code className="text-xs text-gold">{user.company_id}</code>
          </p>
        </div>
      </div>
    </div>
  )
}
