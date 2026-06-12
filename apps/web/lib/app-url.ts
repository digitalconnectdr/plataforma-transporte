const DEFAULT_URL = 'http://localhost:3000'

/**
 * URL pública de la app normalizada: tolera que NEXT_PUBLIC_APP_URL venga
 * sin protocolo o con barra final (pasa al editarla a mano en Vercel).
 */
export function getAppUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/+$/, '')
  if (!raw) return DEFAULT_URL
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
}
