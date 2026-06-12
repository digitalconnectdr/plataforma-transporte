import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/app-url'

const BASE = getAppUrl()

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Áreas privadas y técnicas fuera del índice
        disallow: [
          '/admin/',
          '/super-admin/',
          '/dispatcher/',
          '/corporate/',
          '/driver/',
          '/account/',
          '/auth/',
          '/api/',
          '/track/',
          '/payment/',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
