// ── Cron diario: alertas de documentos y licencias por vencer ─────────────────
// Avisa por email a los conductores cuyos documentos (tabla documents) o
// licencias (drivers.license_expiry) vencen dentro de 30 días.
// Protegido con CRON_SECRET. Programado en vercel.json.

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notify } from '@/lib/notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const WINDOW_DAYS = 30

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const limit = new Date(Date.now() + WINDOW_DAYS * 24 * 3_600_000)
    .toISOString()
    .slice(0, 10)

  let sent = 0

  // Email del conductor vía auth (drivers.id === auth user id)
  async function driverEmail(driverId: string): Promise<string | null> {
    try {
      const { data } = await admin.auth.admin.getUserById(driverId)
      return data.user?.email ?? null
    } catch {
      return null
    }
  }

  // ── 1. Documentos con expires_at próximo ───────────────────────────────────
  const { data: docs } = await admin
    .from('documents')
    .select('id, company_id, driver_id, type, expires_at')
    .not('driver_id', 'is', null)
    .gte('expires_at', today)
    .lte('expires_at', limit)
    .limit(500)

  for (const doc of docs ?? []) {
    if (!doc.driver_id || !doc.expires_at) continue
    const email = await driverEmail(doc.driver_id)
    if (!email) continue

    const result = await notify({
      companyId: doc.company_id,
      channel: 'email',
      type: 'driver_document_expiring',
      recipient: email,
      userId: doc.driver_id,
      vars: {
        document_type: doc.type.replace(/_/g, ' '),
        expiry_date: new Date(doc.expires_at).toLocaleDateString('es-DO'),
      },
    })
    if (result.sent) sent += 1
  }

  // ── 2. Licencias de conducir próximas a vencer ─────────────────────────────
  const { data: drivers } = await admin
    .from('drivers')
    .select('id, company_id, license_expiry')
    .gte('license_expiry', today)
    .lte('license_expiry', limit)
    .limit(500)

  for (const driver of drivers ?? []) {
    if (!driver.license_expiry) continue
    const email = await driverEmail(driver.id)
    if (!email) continue

    const result = await notify({
      companyId: driver.company_id,
      channel: 'email',
      type: 'driver_document_expiring',
      recipient: email,
      userId: driver.id,
      vars: {
        document_type: 'licencia de conducir',
        expiry_date: new Date(driver.license_expiry).toLocaleDateString('es-DO'),
      },
    })
    if (result.sent) sent += 1
  }

  return NextResponse.json({
    ok: true,
    documents: docs?.length ?? 0,
    licenses: drivers?.length ?? 0,
    emailsSent: sent,
  })
}
