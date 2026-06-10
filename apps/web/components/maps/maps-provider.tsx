'use client'

import { APIProvider } from '@vis.gl/react-google-maps'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

interface MapsProviderProps {
  children: React.ReactNode
}

/**
 * Carga la Google Maps JavaScript API una sola vez para toda la app.
 * Envuelve el admin layout para que AddressInput y RouteMap funcionen
 * en cualquier página admin sin cargar el script repetidamente.
 */
export function MapsProvider({ children }: MapsProviderProps) {
  return (
    <APIProvider
      apiKey={API_KEY}
      libraries={['places', 'routes', 'geometry']}
      language="es"
      region="DO"
    >
      {children}
    </APIProvider>
  )
}
