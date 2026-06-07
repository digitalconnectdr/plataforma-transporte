import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from 'sonner'
import { Providers } from './providers'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  title: {
    default: 'LuxeControl — Premium Transportation Platform',
    template: '%s | LuxeControl',
  },
  description:
    'The professional platform for luxury ground transportation companies. Manage bookings, fleet, drivers, and corporate accounts in one place.',
  keywords: [
    'luxury transportation',
    'chauffeur service',
    'ground transportation',
    'airport transfer',
    'executive travel',
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'LuxeControl',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export const viewport: Viewport = {
  themeColor: '#141313',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-le-bg font-sans text-le-on-surface dark:bg-sl-bg dark:text-sl-on-surface antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  'font-sans text-body-md border border-sl-outline-variant bg-sl-surface-high text-sl-on-surface',
                success: '!border-success/30',
                error: '!border-error/30',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
