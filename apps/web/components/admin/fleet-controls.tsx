'use client'

import { useTransition } from 'react'
import {
  updateVehicleStatus,
  assignDriverToVehicle,
  toggleDriverAvailability,
  toggleVehicleTypeActive,
} from '@/app/actions/fleet'
import type { VehicleStatus } from '@/lib/supabase/database.types'

const selectCls =
  'text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-1.5 text-sl-on-surface ' +
  'focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold ' +
  'disabled:opacity-60 disabled:cursor-not-allowed transition-all'

// ── Vehicle Status Select ─────────────────────────────────────────────────────

export function VehicleStatusSelect({
  vehicleId,
  current,
}: {
  vehicleId: string
  current: VehicleStatus
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={current}
        disabled={isPending}
        onChange={(e) =>
          startTransition(async () => {
            await updateVehicleStatus(vehicleId, e.target.value as VehicleStatus)
          })
        }
        className={selectCls}
      >
        <option value="available">Available</option>
        <option value="on_trip">On trip</option>
        <option value="maintenance">Maintenance</option>
        <option value="offline">Offline</option>
        <option value="retired">Retired</option>
      </select>
      {isPending && <span className="text-xs text-sl-on-surface-muted animate-pulse">Saving…</span>}
    </div>
  )
}

// ── Driver Assign Select ──────────────────────────────────────────────────────

export function DriverAssignSelect({
  vehicleId,
  currentDriverId,
  drivers,
}: {
  vehicleId: string
  currentDriverId: string | null
  drivers: Array<{ id: string; first_name: string; last_name: string }>
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={currentDriverId ?? ''}
        disabled={isPending}
        onChange={(e) => {
          const val = e.target.value || null
          startTransition(async () => {
            await assignDriverToVehicle(vehicleId, val)
          })
        }}
        className={selectCls}
      >
        <option value="">Unassigned</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.first_name} {d.last_name}
          </option>
        ))}
      </select>
      {isPending && <span className="text-xs text-sl-on-surface-muted animate-pulse">Saving…</span>}
    </div>
  )
}

// ── Driver Availability Toggle ────────────────────────────────────────────────

export function DriverAvailabilityToggle({
  driverId,
  isAvailable,
}: {
  driverId: string
  isAvailable: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleDriverAvailability(driverId, !isAvailable)
        })
      }
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        isAvailable
          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
          : 'bg-sl-outline-variant/20 text-sl-on-surface-muted border-sl-outline-variant/40 hover:bg-sl-outline-variant/30',
      ].join(' ')}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-sl-on-surface-muted'}`} />
      {isPending ? 'Saving…' : isAvailable ? 'Available' : 'Unavailable'}
    </button>
  )
}

// ── Vehicle Type Active Toggle ────────────────────────────────────────────────

export function VehicleTypeActiveToggle({
  typeId,
  isActive,
}: {
  typeId: string
  isActive: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleVehicleTypeActive(typeId, !isActive)
        })
      }
      className={[
        'text-xs font-medium px-2 py-1 rounded-lg border transition-all',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        isActive
          ? 'text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
          : 'text-sl-on-surface-muted border-sl-outline-variant/40 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20',
      ].join(' ')}
    >
      {isPending ? '…' : isActive ? 'Active' : 'Inactive'}
    </button>
  )
}
