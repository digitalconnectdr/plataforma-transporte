'use client'
// ── F1.11 — Corporate Accounts: controles client-side ─────────────────────────

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createCorporateAccountAction,
  toggleCorporateAccountAction,
  addCorporateMemberAction,
  removeCorporateMemberAction,
} from '@/app/actions/corporate'

const inputCls =
  'w-full text-sm bg-sl-bg border border-sl-outline-variant rounded-lg px-3 py-2 ' +
  'text-sl-on-surface placeholder:text-sl-on-surface-muted/50 ' +
  'focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze'

const labelCls = 'block text-xs text-sl-on-surface-muted mb-1'

// ─── Crear cuenta corporativa ─────────────────────────────────────────────────

export function CreateCorporateAccountForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createCorporateAccountAction(fd)
      if (!result.success) {
        setError(result.error ?? 'Error al crear la cuenta')
        return
      }
      setOpen(false)
      if (result.data?.id) router.push(`/admin/corporate/${result.data.id}`)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium bg-gold text-gray-900 rounded-lg hover:bg-gold/90 transition-colors"
      >
        + Nueva cuenta corporativa
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-sl-surface border border-sl-outline-variant rounded-xl p-5 space-y-4 w-full"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-sl-on-surface">Nueva cuenta corporativa</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-sl-on-surface-muted hover:text-red-500">
          ✕ Cancelar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>Nombre de la empresa cliente *</label>
          <input name="name" required placeholder="Acme Corp" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Contacto</label>
          <input name="contact_name" placeholder="María García" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email de contacto</label>
          <input name="contact_email" type="email" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email de facturación</label>
          <input name="billing_email" type="email" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Teléfono</label>
          <input name="phone" type="tel" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>RNC / Tax ID</label>
          <input name="tax_id" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Límite de crédito (USD)</label>
          <input name="credit_limit" type="number" min="0" step="100" defaultValue={0} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Términos de pago (días)</label>
          <input name="payment_terms" type="number" min="0" defaultValue={30} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Ciclo de facturación</label>
          <select name="billing_cycle" defaultValue="monthly" className={inputCls}>
            <option value="weekly">Semanal</option>
            <option value="bi_weekly">Quincenal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input name="require_approval" type="checkbox" value="true" className="w-4 h-4 rounded accent-bronze" />
        <span className="text-sm text-sl-on-surface">Los viajes requieren aprobación del manager</span>
      </label>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium bg-gold text-gray-900 rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Creando…' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  )
}

// ─── Toggle activa/inactiva ───────────────────────────────────────────────────

export function CorporateAccountToggle({
  accountId,
  isActive,
}: {
  accountId: string
  isActive: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleCorporateAccountAction(accountId, !isActive)
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
      {isPending ? '…' : isActive ? 'Activa' : 'Inactiva'}
    </button>
  )
}

// ─── Agregar miembro ──────────────────────────────────────────────────────────

export function AddCorporateMemberForm({ accountId }: { accountId: string }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('account_id', accountId)
    startTransition(async () => {
      const result = await addCorporateMemberAction(fd)
      if (!result.success) {
        setError(result.error ?? 'Error al agregar miembro')
        return
      }
      setSuccess(true)
      form.reset()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Email del usuario (debe estar registrado)</label>
          <input name="email" type="email" required placeholder="usuario@empresa.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Rol</label>
          <select name="role" defaultValue="user" className={inputCls}>
            <option value="user">Usuario</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Centro de costo</label>
          <input name="cost_center" placeholder="Ventas" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Límite por viaje (USD)</label>
          <input name="spending_limit" type="number" min="0" step="10" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Límite mensual (USD)</label>
          <input name="monthly_limit" type="number" min="0" step="100" className={inputCls} />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}
      {success && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          ✓ Miembro agregado
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium bg-gold text-gray-900 rounded-lg hover:bg-gold/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Agregando…' : '+ Agregar miembro'}
        </button>
      </div>
    </form>
  )
}

// ─── Quitar miembro ───────────────────────────────────────────────────────────

export function RemoveMemberButton({ memberId }: { memberId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!window.confirm('¿Quitar este miembro de la cuenta corporativa?')) return
        startTransition(async () => {
          await removeCorporateMemberAction(memberId)
        })
      }}
      className="text-xs text-red-500 hover:text-red-600 hover:underline disabled:opacity-50"
    >
      {isPending ? '…' : 'Quitar'}
    </button>
  )
}
