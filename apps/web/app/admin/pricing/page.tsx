import { requireRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/server'
import { createPricingRuleAction } from '@/app/actions/pricing'
import { PricingRuleActiveToggle, PricingRuleDeleteButton } from '@/components/admin/pricing-controls'
import type { PricingModel } from '@/lib/supabase/database.types'

const MODEL_LABELS: Record<PricingModel, string> = {
  flat_rate:  'Flat Rate',
  per_mile:   'Per Mile',
  per_km:     'Per KM',
  hourly:     'Hourly',
  zone_based: 'Zone Based',
}

const MODEL_BADGE: Record<PricingModel, string> = {
  flat_rate:  'bg-blue-50 text-blue-700 border-blue-200',
  per_mile:   'bg-green-50 text-green-700 border-green-200',
  per_km:     'bg-teal-50 text-teal-700 border-teal-200',
  hourly:     'bg-purple-50 text-purple-700 border-purple-200',
  zone_based: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default async function PricingPage() {
  const user = await requireRole('company_owner', 'company_admin')

  const admin = createAdminClient()

  const [{ data: rules }, { data: vehicleTypes }, { data: zones }] = await Promise.all([
    admin
      .from('pricing_rules')
      .select('id, name, model, base_price, per_mile_rate, hourly_rate, minimum_fare, priority, is_active, vehicle_type_id')
      .eq('company_id', user.company_id!)
      .order('priority', { ascending: false })
      .order('name', { ascending: true }),
    admin
      .from('vehicle_types')
      .select('id, name')
      .eq('company_id', user.company_id!)
      .eq('is_active', true)
      .order('name'),
    admin
      .from('service_zones')
      .select('id, name')
      .eq('company_id', user.company_id!)
      .eq('is_active', true)
      .order('name'),
  ])

  // Map vehicle type id → name for display
  const vtMap = new Map((vehicleTypes ?? []).map((vt) => [vt.id, vt.name]))

  // void cast — TypeScript void-callback rule
  const pricingAction: (fd: FormData) => void = createPricingRuleAction

  return (
    <div className="p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-playfair font-semibold text-sl-on-surface">Pricing Rules</h1>
          <p className="mt-1 text-sm text-sl-on-surface-muted">
            Configure rate models for your fleet. Higher priority rules are evaluated first.
          </p>
        </div>
        <span className="text-xs text-sl-on-surface-muted">
          {rules?.length ?? 0} rule{rules?.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Add Rule Form */}
      <div className="bg-sl-surface border border-sl-outline-variant rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-sl-on-surface mb-4">Add Pricing Rule</h2>
        <form action={pricingAction}>
          <div className="grid grid-cols-2 gap-4 mb-4">

            {/* Name */}
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Rule Name *</label>
              <input
                name="name"
                required
                placeholder="e.g. Standard Sedan Rate"
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface placeholder:text-sl-on-surface-muted/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Pricing Model *</label>
              <select
                name="model"
                required
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="">Select model…</option>
                {Object.entries(MODEL_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Vehicle Type (optional)</label>
              <select
                name="vehicle_type_id"
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="">All vehicle types</option>
                {(vehicleTypes ?? []).map((vt) => (
                  <option key={vt.id} value={vt.id}>{vt.name}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Priority (higher = first)</label>
              <input
                name="priority"
                type="number"
                defaultValue="0"
                min="0"
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* Base Price */}
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Base Price ($)</label>
              <input
                name="base_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* Per Mile Rate */}
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Per Mile Rate ($)</label>
              <input
                name="per_mile_rate"
                type="number"
                step="0.0001"
                min="0"
                defaultValue="0"
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Hourly Rate ($)</label>
              <input
                name="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* Minimum Fare */}
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Minimum Fare ($)</label>
              <input
                name="minimum_fare"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* Night Surcharge */}
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Night Surcharge (%)</label>
              <input
                name="night_surcharge_pct"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* Weekend Surcharge */}
            <div>
              <label className="block text-xs text-sl-on-surface-muted mb-1">Weekend Surcharge (%)</label>
              <input
                name="weekend_surcharge_pct"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                className="w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-gold text-gray-900 rounded-lg hover:bg-gold/90 transition-colors"
            >
              Create Rule
            </button>
          </div>
        </form>
      </div>

      {/* Rules Table */}
      {!rules || rules.length === 0 ? (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl p-12 text-center">
          <p className="text-sm text-sl-on-surface-muted">No pricing rules yet.</p>
          <p className="mt-1 text-xs text-sl-on-surface-muted">Create your first rule above to start calculating trip fares.</p>
        </div>
      ) : (
        <div className="bg-sl-surface border border-sl-outline-variant rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sl-outline-variant">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Rule</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Model</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Base</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Min Fare</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Priority</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-sl-on-surface-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sl-outline-variant/40">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-sl-bg/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-sl-on-surface">{rule.name}</p>
                    {rule.vehicle_type_id && (
                      <p className="text-xs text-sl-on-surface-muted mt-0.5">
                        {vtMap.get(rule.vehicle_type_id) ?? rule.vehicle_type_id}
                      </p>
                    )}
                    {!rule.vehicle_type_id && (
                      <p className="text-xs text-sl-on-surface-muted mt-0.5">All vehicle types</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${MODEL_BADGE[rule.model as PricingModel] ?? ''}`}>
                      {MODEL_LABELS[rule.model as PricingModel] ?? rule.model}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-sl-on-surface">
                    ${Number(rule.base_price).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sl-on-surface-muted">
                    {rule.minimum_fare ? `$${Number(rule.minimum_fare).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-xs font-mono text-sl-on-surface-muted">{rule.priority ?? 0}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <PricingRuleActiveToggle ruleId={rule.id} isActive={rule.is_active} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <PricingRuleDeleteButton ruleId={rule.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
