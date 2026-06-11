import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import { createZoneAction } from '@/app/actions/services'
import { ZoneActiveToggle, ZoneDeleteButton } from '@/components/admin/zone-controls'
import { getDict } from '@/lib/i18n/server'

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

  // void cast — TypeScript void-callback rule: (fd) => void accepts any return type
  const zoneAction: (fd: FormData) => void = createZoneAction
  const t = getDict().admin.zones

  return (
    <div className="p-8 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-playfair font-semibold text-sl-on-surface">{t.title}</h1>
          <p className="mt-1 text-sm text-sl-on-surface-muted">
            {t.subtitle}
          </p>
        </div>
        {isAdmin && (
          <span className="text-xs text-sl-on-surface-muted">
            {zones?.length ?? 0} {t.count}
          </span>
        )}
      </div>

      {/* Add Zone Form */}
      {isAdmin && (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-sl-on-surface mb-4">{t.addTitle}</h2>
          <form action={zoneAction} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-sl-on-surface-muted mb-1">{t.nameLabel}</label>
              <input
                name="name"
                required
                placeholder={t.namePlaceholder}
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface placeholder:text-sl-on-surface-muted/50 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
              />
            </div>
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">{t.typeLabel}</label>
              <select
                name="type"
                defaultValue="standard"
                className="text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
              >
                {ZONE_TYPES.map((zt) => (
                  <option key={zt} value={zt}>{t.types[zt]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">{t.colorLabel}</label>
              <input
                name="color"
                type="color"
                defaultValue="#e9c176"
                className="h-9 w-14 rounded-lg border border-sl-outline-variant bg-sl-bg cursor-pointer"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-gold text-gray-900 rounded-lg hover:bg-gold/90 transition-colors"
            >
              {t.addButton}
            </button>
          </form>
        </div>
      )}

      {/* Zones Table */}
      {!zones || zones.length === 0 ? (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl p-12 text-center">
          <p className="text-sm text-sl-on-surface-muted">{t.empty}</p>
          {isAdmin && (
            <p className="mt-1 text-xs text-sl-on-surface-muted">{t.emptyHint}</p>
          )}
        </div>
      ) : (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sl-outline-variant">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">{t.thZone}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">{t.thType}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">{t.thRadius}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">{t.thStatus}</th>
                {isAdmin && (
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">{t.thActions}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-sl-outline-variant/40">
              {zones.map((zone) => {
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
                      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${zoneBadge[zone.type as ZoneType] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {t.types[zone.type as ZoneType] ?? zone.type}
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
                          {zone.is_active ? t.active : t.inactive}
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
