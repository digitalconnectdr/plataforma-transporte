import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luxeride.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]

  // Páginas de reserva de cada empresa activa
  try {
    const admin = createAdminClient()
    const { data: companies } = await admin
      .from('companies')
      .select('slug, updated_at')
      .eq('status', 'active')
      .limit(500)

    for (const c of companies ?? []) {
      entries.push({
        url: `${BASE}/book/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
  } catch {
    // Sin DB en build — devolvemos solo el landing
  }

  return entries
}
