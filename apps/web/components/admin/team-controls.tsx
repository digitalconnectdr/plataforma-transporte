'use client'

import { useTransition } from 'react'
import { toggleTeamMemberActiveAction, updateTeamMemberRoleAction } from '@/app/actions/team'
import type { UserRole } from '@/lib/auth/permissions'

const ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: 'company_admin', label: 'Admin' },
  { value: 'dispatcher',    label: 'Dispatcher' },
  { value: 'accounting',    label: 'Accounting' },
  { value: 'driver',        label: 'Driver' },
  { value: 'customer',      label: 'Customer' },
]

export function TeamMemberActiveToggle({
  memberId,
  isActive,
}: {
  memberId: string
  isActive: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleTeamMemberActiveAction(memberId, !isActive)
        })
      }
      className={[
        'text-xs font-medium px-2.5 py-1 rounded-lg border transition-all',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        isActive
          ? 'text-green-700 border-green-300 bg-green-50 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
          : 'text-gray-500 border-gray-300 bg-gray-50 hover:bg-green-50 hover:text-green-700 hover:border-green-300',
      ].join(' ')}
    >
      {isPending ? '…' : isActive ? 'Active' : 'Inactive'}
    </button>
  )
}

export function TeamMemberRoleSelect({
  memberId,
  currentRole,
}: {
  memberId: string
  currentRole: UserRole
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={currentRole}
        disabled={isPending}
        onChange={(e) =>
          startTransition(async () => {
            await updateTeamMemberRoleAction(memberId, e.target.value as UserRole)
          })
        }
        className="text-xs bg-sl-bg border border-sl-outline-variant rounded-lg px-2 py-1 text-sl-on-surface focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {ASSIGNABLE_ROLES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      {isPending && <span className="text-xs text-sl-on-surface-muted animate-pulse">Saving…</span>}
    </div>
  )
}
