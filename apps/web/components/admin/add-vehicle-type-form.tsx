'use client'

import { useFormState } from 'react-dom'
import { createVehicleTypeAction } from '@/app/actions/fleet'

const VEHICLE_CLASSES = [
  'sedan', 'suv', 'van', 'limousine', 'sprinter', 'bus', 'exotic',
] as const

const inputCls =
  'w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-xl px-4 py-2.5 text-sl-on-surface ' +
  'placeholder:text-sl-on-surface-muted focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze transition-all'

export function AddVehicleTypeForm() {
  const [state, action, isPending] = useFormState(createVehicleTypeAction, null)

  return (
    <div className="bg-sl-surface-high border border-sl-outline-variant rounded-2xl p-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-sl-on-surface-muted mb-4">
        Add Vehicle Type
      </h2>

      {state && !state.success && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-400">{state.error}</p>
        </div>
      )}
      {state?.success && (
        <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3">
          <p className="text-sm text-green-400">Vehicle type added.</p>
        </div>
      )}

      <form action={action} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-sl-on-surface-muted">Name *</label>
          <input name="name" type="text" required placeholder="Executive Black Sedan" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-sl-on-surface-muted">Class *</label>
          <select name="class" required className={inputCls}>
            <option value="">Select class…</option>
            {VEHICLE_CLASSES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-sl-on-surface-muted">Capacity *</label>
          <input name="capacity" type="number" min="1" max="60" required placeholder="4" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-sl-on-surface-muted">Amenities (comma-separated)</label>
          <input name="amenities" type="text" placeholder="WiFi, Water, Charger" className={inputCls} />
        </div>

        <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 text-sm font-semibold bg-gold text-gray-900 rounded-xl hover:bg-gold/90 disabled:opacity-60 transition-all"
          >
            {isPending ? 'Adding…' : 'Add Type'}
          </button>
        </div>
      </form>
    </div>
  )
}
