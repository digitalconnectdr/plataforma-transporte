// ── Google Maps — Configuración global ────────────────────────────────────────

/** Centro por defecto: República Dominicana */
export const DEFAULT_MAP_CENTER = { lat: 18.4861, lng: -69.9312 }
export const DEFAULT_MAP_ZOOM = 10

/**
 * Estilos minimalistas para el mapa — Apple White palette
 * Sin POIs, sin tránsito; solo carreteras limpias sobre fondo claro.
 */
export const APPLE_WHITE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'all',        elementType: 'labels.icon',          stylers: [{ visibility: 'off' }] },
  { featureType: 'poi',                                              stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park',                                         stylers: [{ visibility: 'simplified' }] },
  { featureType: 'transit',                                          stylers: [{ visibility: 'off' }] },
  { featureType: 'road',       elementType: 'geometry.fill',         stylers: [{ color: '#ffffff' }] },
  { featureType: 'road',       elementType: 'geometry.stroke',       stylers: [{ color: '#e5e5ea' }] },
  { featureType: 'road',       elementType: 'labels.text.fill',      stylers: [{ color: '#86868b' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill',       stylers: [{ color: '#f5f5f7' }] },
  { featureType: 'landscape',  elementType: 'geometry.fill',         stylers: [{ color: '#f5f5f7' }] },
  { featureType: 'water',      elementType: 'geometry.fill',         stylers: [{ color: '#c7c7cc' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke',   stylers: [{ color: '#d2d2d7' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill',  stylers: [{ color: '#6e6e73' }] },
]
