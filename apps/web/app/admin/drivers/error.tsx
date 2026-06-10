'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DriversError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Loguear el error completo en la consola del browser (visible en DevTools)
    console.error('[drivers] Error boundary capturó:', error)
  }, [error])

  return (
    <div className="p-8 max-w-xl">
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-red-400">
            Error al cargar Conductores
          </h2>
          <p className="text-sm text-sl-on-surface-muted mt-1">
            Ocurrió un error inesperado al renderizar esta página.
          </p>
        </div>

        {/* Digest — útil para correlacionar con Vercel Function Logs */}
        {error.digest && (
          <div className="bg-sl-bg rounded-lg px-3 py-2">
            <p className="text-[10px] font-mono text-sl-on-surface-muted">
              Digest: <span className="text-sl-on-surface">{error.digest}</span>
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 text-xs font-semibold bg-gold text-gray-900 rounded-xl hover:bg-gold/90 transition-colors"
          >
            Reintentar
          </button>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 text-xs font-semibold border border-sl-outline-variant text-sl-on-surface-muted rounded-xl hover:border-sl-on-surface/40 transition-colors"
          >
            Ir al Dashboard
          </Link>
        </div>

        <p className="text-[11px] text-sl-on-surface-muted">
          Para ver el detalle del error, revisa los{' '}
          <strong className="text-sl-on-surface">Vercel Function Logs</strong>{' '}
          en tu proyecto y busca líneas que comiencen con{' '}
          <code className="font-mono text-gold">[drivers/page]</code>.
        </p>
      </div>
    </div>
  )
}
