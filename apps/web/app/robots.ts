import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luxeride.vercel.app'

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
