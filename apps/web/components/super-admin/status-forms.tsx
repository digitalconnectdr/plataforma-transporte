'use client'

import { useTransition } from 'react'
import { updateCompanyStatus, updateCompanyPlan } from '@/app/actions/companies'
import type { CompanyStatus, CompanyPlan } from '@/lib/supabase/database.types'

const selectCls =
  'text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-1.5 text-sl-on-surface ' +
  'focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze ' +
  'disabled:opacity-60 disabled:cursor-not-allowed transition-all'

export function StatusSelect({
  companyId,
  current,
}: {
  companyId: string
  current: CompanyStatus
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as CompanyStatus
    startTransition(async () => {
      await updateCompanyStatus(companyId, next)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={current}
        onChange={handleChange}
        disabled={isPending}
        className={selectCls}
      >
        <option value="trial">Trial</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="cancelled">Cancelled</option>
      </select>
      {isPending && (
        <span className="text-xs text-sl-on-surface-muted animate-pulse">Saving…</span>
      )}
    </div>
  )
}

export function PlanSelect({
  companyId,
  current,
}: {
  companyId: string
  current: CompanyPlan
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as CompanyPlan
    startTransition(async () => {
      await updateCompanyPlan(companyId, next)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={current}
        onChange={handleChange}
        disabled={isPending}
        className={selectCls}
      >
        <option value="free">Free</option>
        <option value="starter">Starter</option>
        <option value="professional">Professional</option>
        <option value="enterprise">Enterprise</option>
      </select>
      {isPending && (
        <span className="text-xs text-sl-on-surface-muted animate-pulse">Saving…</span>
      )}
    </div>
  )
}
