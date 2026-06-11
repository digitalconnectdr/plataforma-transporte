// ── F1.17 — Rate limiting para endpoints públicos ─────────────────────────────
// Sliding-window en memoria por instancia serverless. No sustituye un WAF,
// pero frena abuso básico (scraping de cotizaciones, spam de reservaciones).

import { headers } from 'next/headers'

interface Window {
  count: number
  resetAt: number
}

const buckets = new Map<string, Window>()
const MAX_BUCKETS = 10_000

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return
  for (const [key, w] of buckets) {
    if (w.resetAt <= now) buckets.delete(key)
  }
}

/** IP del cliente desde los headers del proxy (Vercel setea x-forwarded-for). */
export function getClientIp(): string {
  const h = headers()
  const fwd = h.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  return h.get('x-real-ip') ?? 'unknown'
}

/**
 * true si la petición está dentro del límite; false si debe rechazarse.
 * @param action  nombre lógico del endpoint ('public_quote', 'public_booking', …)
 * @param limit   peticiones permitidas por ventana
 * @param windowMs duración de la ventana en ms (default 60s)
 */
export function checkRateLimit(action: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now()
  prune(now)

  const key = `${action}:${getClientIp()}`
  const win = buckets.get(key)

  if (!win || win.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  win.count += 1
  return win.count <= limit
}

export const RATE_LIMIT_ERROR =
  'Demasiadas solicitudes. Espera un momento e intenta de nuevo.'
