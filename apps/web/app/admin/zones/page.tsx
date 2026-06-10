import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import { createZoneAction } from '@/app/actions/services'
import { ZoneActiveToggle, ZoneDeleteButton } from '@/components/admin/zone-controls'

const ZONE_TYPES = ['standard', 'airport', 'premium', 'restricted'] as const
type ZoneType = (typeof ZONE_TYPES)[number]

const zoneBadge: Record<ZoneType, string> = {
  standard:   'bg-blue-50 text-blue-700 border-blue-200',
  airport:    'bg-purple-50 text-purple-700 border-purple-200',
  premium:    'bg-amber-50 text-amber-700 border-amber-200',
  restricted: 'bg-red-50 text-red-700 border-red-200',
}

export default async function ZonesPage() {
  const user = await requireRole('company_owner', 'company_admin', 'dispatcher')
  const isAdmin = user.role === 'company_owner' || user.role === 'company_admin'

  const admin = createAdminClient()
  const { data: zones } = await admin
    .from('service_zones')
    .select('id, name, type, color, radius_miles, sort_order, is_active, created_at')
    .eq('company_id', user.company_id!)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  return (
    <div className="p-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-playfair font-semibold text-sl-on-surface">Service Zones</h1>
          <p className="mt-1 text-sm text-sl-on-surface-muted">
            Define geographic pricing areas for your service region.
          </p>
        </div>
        {isAdmin && (
          <span className="text-xs text-sl-on-surface-muted">
            {zones?.length ?? 0} zone{zones?.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Add Zone Form */}
      {isAdmin && (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-sl-on-surface mb-4">Add Zone</h2>
          <form action={createZoneAction} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-sl-on-surface-muted mb-1">Zone Name</label>
              <input
                name="name"
                required
                placeholder="e.g. Downtown Manhattan"
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface placeholder:text-sl-on-surface-muted/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Type</label>
              <select
                name="type"
                defaultValue="standard"
                className="text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {ZONE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Color</label>
              <input
                name="color"
                type="color"
                defaultValue="#e9c176"
                className="h-9 w-14 rounded-lg border border-sl-outline-variant bg-sl-bg cursor-pointer"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-gold text-sl-bg rounded-lg hover:bg-gold/90 transition-colors"
            >
              Add Zone
            </button>
          </form>
        </div>
      )}

      {/* Zones Table */}
      {!zones || zones.length === 0 ? (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl p-12 text-center">
          <p className="text-sm text-sl-on-surface-muted">No service zones yet.</p>
          {isAdmin && (
            <p className="mt-1 text-xs text-sl-on-surface-muted">Add your first zone above to start defining pricing areas.</p>
          )}
        </div>
      ) : (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sl-outline-variant">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Zone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Radius</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Status</th>
                {isAdmin && (
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-sl-outline-variant/40">
              {zones.map((zone) => {
                const t = zone.type as ZoneType
                return (
                  <tr key={zone.id} className="hover:bg-sl-bg/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                          style={{ backgroundColor: zone.color ?? '#e9c176' }}
                        />
                        <span className="font-medium text-sl-on-surface">{zone.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${zoneBadge[t] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {zone.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sl-on-surface-muted text-xs">
                      {zone.radius_miles ? `${zone.radius_miles} mi` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {isAdmin ? (
                        <ZoneActiveToggle zoneId={zone.id} isActive={zone.is_active} />
                      ) : (
                        <span className={`text-xs font-medium ${zone.is_active ? 'text-green-700' : 'text-gray-400'}`}>
                          {zone.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <ZoneDeleteButton zoneId={zone.id} />
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
