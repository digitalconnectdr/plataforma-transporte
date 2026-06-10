'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import type { CompanyStatus, CompanyPlan } from '@/lib/supabase/database.types'

export type CompanyActionResult = {
  success: boolean
  error?: string
}

export async function updateCompanyStatus(
  companyId: string,
  status: CompanyStatus
): Promise<CompanyActionResult> {
  // Throws redirect if caller isn't super_admin
  await requireRole('super_admin')

  const admin = createAdminClient()
  const { error } = await admin
    .from('companies')
    .update({ status })
    .eq('id', companyId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/super-admin/companies')
  revalidatePath(`/super-admin/companies/${companyId}`)
  return { success: true }
}

export async function updateCompanyPlan(
  companyId: string,
  plan: CompanyPlan
): Promise<CompanyActionResult> {
  await requireRole('super_admin')

  const admin = createAdminClient()
  const { error } = await admin
    .from('companies')
    .update({ plan })
    .eq('id', companyId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/super-admin/companies')
  revalidatePath(`/super-admin/companies/${companyId}`)
  return { success: true }
}
