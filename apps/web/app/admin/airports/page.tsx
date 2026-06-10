import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import { addCompanyAirportAction } from '@/app/actions/services'
import { AirportActiveToggle, AirportRemoveButton } from '@/components/admin/airport-controls'

export default async function AirportsPage() {
  const user = await requireRole('company_owner', 'company_admin', 'dispatcher')
  const isAdmin = user.role === 'company_owner' || user.role === 'company_admin'

  const admin = createAdminClient()

  // Two separate queries — avoids Supabase FK-relation type resolution
  const [{ data: companyAirports }, { data: allAirports }] = await Promise.all([
    admin
      .from('company_airports')
      .select('id, airport_id, pickup_fee, dropoff_fee, is_active')
      .eq('company_id', user.company_id!)
      .order('created_at', { ascending: true }),
    admin
      .from('airports')
      .select('id, iata_code, name, city, state, country')
      .eq('is_active', true)
      .order('country', { ascending: true })
      .order('city', { ascending: true }),
  ])

  // Build a lookup map and compute which airports haven't been added yet
  const airportsMap = Object.fromEntries((allAirports ?? []).map((a) => [a.id, a]))
  const addedAirportIds = new Set((companyAirports ?? []).map((ca) => ca.airport_id))
  const notAddedAirports = (allAirports ?? []).filter((a) => !addedAirportIds.has(a.id))

  return (
    <div className="p-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-playfair font-semibold text-sl-on-surface">Airports</h1>
          <p className="mt-1 text-sm text-sl-on-surface-muted">
            Configure airport pickup and drop-off fees for your service area.
          </p>
        </div>
        {isAdmin && (
          <span className="text-xs text-sl-on-surface-muted">
            {companyAirports?.length ?? 0} configured
          </span>
        )}
      </div>

      {/* Add Airport Form */}
      {isAdmin && notAddedAirports.length > 0 && (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-sl-on-surface mb-4">Add Airport</h2>
          <form action={addCompanyAirportAction} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-sl-on-surface-muted mb-1">Airport</label>
              <select
                name="airport_id"
                required
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="">Select airport…</option>
                {notAddedAirports.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.iata_code} — {a.name} ({a.city}, {a.country})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Pickup Fee ($)</label>
              <input
                name="pickup_fee"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                className="w-24 text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Drop-off Fee ($)</label>
              <input
                name="dropoff_fee"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                className="w-24 text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-gold text-sl-bg rounded-lg hover:bg-gold/90 transition-colors"
            >
              Add Airport
            </button>
          </form>
        </div>
      )}

      {/* Airports Table */}
      {!companyAirports || companyAirports.length === 0 ? (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl p-12 text-center">
          <p className="text-sm text-sl-on-surface-muted">No airports configured yet.</p>
          {isAdmin && (
            <p className="mt-1 text-xs text-sl-on-surface-muted">Add airports above to configure pickup and drop-off surcharges.</p>
          )}
        </div>
      ) : (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sl-outline-variant">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Airport</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Pickup</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Drop-off</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Status</th>
                {isAdmin && (
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-sl-outline-variant/40">
              {companyAirports.map((ca) => {
                const airport = airportsMap[ca.airport_id] ?? null
                return (
                  <tr key={ca.id} className="hover:bg-sl-bg/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-semibold text-sl-on-surface text-xs bg-sl-outline-variant/30 px-1.5 py-0.5 rounded mr-2">
                          {airport?.iata_code}
                        </span>
                        <span className="text-sl-on-surface">{airport?.name}</span>
                      </div>
                      <p className="text-xs text-sl-on-surface-muted mt-0.5 pl-9">
                        {airport?.city}, {airport?.country}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-medium text-sl-on-surface">
                        ${Number(ca.pickup_fee).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-medium text-sl-on-surface">
                        ${Number(ca.dropoff_fee).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {isAdmin ? (
                        <AirportActiveToggle id={ca.id} isActive={ca.is_active} />
                      ) : (
                        <span className={`text-xs font-medium ${ca.is_active ? 'text-green-700' : 'text-gray-400'}`}>
                          {ca.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <AirportRemoveButton id={ca.id} />
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
