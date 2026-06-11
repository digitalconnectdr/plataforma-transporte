'use client'
// ── Botón de avance de viaje para el conductor ─────────────────────────────────

import { useState, useTransition } from 'react'
import { driverAdvanceTripAction } from '@/app/actions/driver'

const NEXT_LABEL: Record<string, string> = {
  assigned:    '🚗 Iniciar ruta al pickup',
  en_route:    '📍 Marcar que llegué',
  arrived:     '▶️ Iniciar viaje',
  in_progress: '✓ Completar viaje',
}

export function DriverTripActions({
  bookingId,
  status,
}: {
  bookingId: string
  status: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const label = NEXT_LABEL[status]
  if (!label) return null

  function handleAdvance() {
    setError('')
    startTransition(async () => {
      const result = await driverAdvanceTripAction(bookingId)
      if (!result.success) setError(result.error ?? 'Error al actualizar')
    })
  }

  return (
    <div className="pt-3 border-t border-sl-outline-variant space-y-2">
      <button
        onClick={handleAdvance}
        disabled={isPending}
        className="w-full py-3 text-sm font-semibold bg-gold text-gray-900 rounded-xl hover:bg-gold/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Guardando…' : label}
      </button>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
