// ── Google Places — Tipos compartidos ─────────────────────────────────────────

/**
 * Resultado de una selección de dirección en el Autocomplete de Places.
 * Se usa en AddressInput y se pasa a los Server Actions de bookings.
 */
export interface PlaceResult {
  /** Dirección formateada (ej. "Av. 27 de Febrero 123, Santo Domingo, DO") */
  address: string
  /** Latitud decimal */
  lat: number
  /** Longitud decimal */
  lng: number
  /** Google Place ID */
  placeId: string
}
