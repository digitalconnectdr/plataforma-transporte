// ── Google Routes API — Cálculo de ruta server-side ───────────────────────────
// Seguro: se ejecuta solo en Server Actions / Route Handlers.
// Nunca exponer este módulo al cliente.

export interface RouteCalculation {
  distanceMeters: number
  /** Distancia en kilómetros (redondeado a 1 decimal) */
  distanceKm:     number
  /** Distancia en millas (redondeado a 1 decimal) */
  distanceMi:     number
  durationSeconds: number
  /** Duración en minutos (redondeado) */
  durationMinutes: number
}

/**
 * Calcula la distancia y duración de conducción entre dos puntos.
 * Usa la Google Routes API v2 (computeRoutes).
 *
 * @returns RouteCalculation o null si la API key no está configurada / hubo error.
 */
export async function calculateRoute(
  originLat:  number,
  originLng:  number,
  destLat:    number,
  destLng:    number,
): Promise<RouteCalculation | null> {
  // Usar la key del servidor (no expuesta al browser)
  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!apiKey || apiKey === 'placeholder') {
    console.warn('[Maps] GOOGLE_MAPS_SERVER_KEY no configurado — omitiendo cálculo de ruta')
    return null
  }

  try {
    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'X-Goog-Api-Key':  apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
      },
      body: JSON.stringify({
        origin:      { location: { latLng: { latitude: originLat, longitude: originLng } } },
        destination: { location: { latLng: { latitude: destLat,   longitude: destLng   } } },
        travelMode:  'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
      }),
      // No cachear — el tráfico cambia
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error('[Maps] Routes API error:', res.status, await res.text())
      return null
    }

    const data = await res.json()
    const route = data.routes?.[0]
    if (!route) return null

    const distanceMeters: number = route.distanceMeters ?? 0
    // La duración viene como string "123s"
    const durationSeconds: number = parseInt(
      (route.duration ?? '0s').replace('s', ''),
      10,
    )

    return {
      distanceMeters,
      distanceKm:      Math.round(distanceMeters / 100) / 10,
      distanceMi:      Math.round((distanceMeters / 1609.34) * 10) / 10,
      durationSeconds,
      durationMinutes: Math.round(durationSeconds / 60),
    }
  } catch (err) {
    console.error('[Maps] calculateRoute error:', err)
    return null
  }
}
