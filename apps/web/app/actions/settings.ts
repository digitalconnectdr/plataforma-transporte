'use server'
// ── F1.7 — Company Settings: Server Actions ───────────────────────────────────
// SECURITY: Solo company_owner puede modificar settings.
// OWASP compliant — company_id del servidor, nunca del cliente.

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

export async function updateCompanyInfoAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await requireRole('company_owner')
  if (!user.company_id) return { success: false, error: 'Sin empresa asignada' }

  const name     = (formData.get('name') as string ?? '').trim()
  const phone    = (formData.get('phone') as string ?? '').trim() || null
  const email    = (formData.get('email') as string ?? '').trim() || null
  const address  = (formData.get('address') as string ?? '').trim() || null
  const city     = (formData.get('city') as string ?? '').trim() || null
  const country  = (formData.get('country') as string ?? '').trim() || null
  const timezone = (formData.get('timezone') as string ?? '').trim() || null
  const currency = (formData.get('currency') as string ?? '').trim() || null

  if (!name) return { success: false, error: 'Nombre de empresa requerido' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('companies')
    .update({
      name,
      phone:    phone ?? undefined,
      email:    email ?? undefined,
      address:  address ?? undefined,
      city:     city ?? undefined,
      country:  country ?? undefined,
      timezone: timezone ?? undefined,
      currency: currency ?? undefined,
    })
    .eq('id', user.company_id)

  if (error) {
    console.error('[updateCompanyInfoAction]', error)
    return { success: false, error: 'Error al actualizar la información' }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function updateBookingSettingsAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await requireRole('company_owner')
  if (!user.company_id) return { success: false, error: 'Sin empresa asignada' }

  const advanceHours       = parseInt(formData.get('advance_booking_hours') as string ?? '2', 10) || 2
  const maxAdvanceDays     = parseInt(formData.get('max_advance_days') as string ?? '90', 10) || 90
  const allowInstant       = formData.get('allow_instant_booking') === 'true'
  const requireDeposit     = formData.get('require_deposit') === 'true'
  const depositPercentage  = parseFloat(formData.get('deposit_percentage') as string ?? '0') || 0

  const admin = createAdminClient()

  // Fetch current settings to merge (JSONB merge)
  const { data: company } = await admin
    .from('companies')
    .select('settings')
    .eq('id', user.company_id)
    .single()

  if (!company) return { success: false, error: 'Empresa no encontrada' }

  const currentSettings = (company.settings as Record<string, unknown>) ?? {}
  const updatedSettings = {
    ...currentSettings,
    booking: {
      advance_booking_hours: advanceHours,
      max_advance_days:      maxAdvanceDays,
      allow_instant_booking: allowInstant,
      require_deposit:       requireDeposit,
      deposit_percentage:    depositPercentage,
    },
  }

  const { error } = await admin
    .from('companies')
    .update({ settings: updatedSettings })
    .eq('id', user.company_id)

  if (error) {
    console.error('[updateBookingSettingsAction]', error)
    return { success: false, error: 'Error al actualizar configuración de reservaciones' }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function updateGratuitySettingsAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await requireRole('company_owner')
  if (!user.company_id) return { success: false, error: 'Sin empresa asignada' }

  const enabled           = formData.get('enabled') === 'true'
  const defaultPercentage = parseFloat(formData.get('default_percentage') as string ?? '20') || 20

  const admin = createAdminClient()

  const { data: company } = await admin
    .from('companies')
    .select('settings')
    .eq('id', user.company_id)
    .single()

  if (!company) return { success: false, error: 'Empresa no encontrada' }

  const currentSettings = (company.settings as Record<string, unknown>) ?? {}
  const updatedSettings = {
    ...currentSettings,
    gratuity: {
      enabled,
      default_percentage: defaultPercentage,
      options: [15, 18, 20, 25],
    },
  }

  const { error } = await admin
    .from('companies')
    .update({ settings: updatedSettings })
    .eq('id', user.company_id)

  if (error) {
    console.error('[updateGratuitySettingsAction]', error)
    return { success: false, error: 'Error al actualizar configuración de gratuity' }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}
