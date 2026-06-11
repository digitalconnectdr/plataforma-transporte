# Phase 2 — Apps Móviles Diferenciadoras

> Rediseñado 2026-06-11 sobre el sistema ya construido (Phase 1 completa:
> dispatch realtime, pagos Stripe+manuales, policy engine, corporate,
> notificaciones, tracking público, flight tracking, i18n EN/ES/PT).

## Por qué las apps son EL diferenciador

| | Limo Anywhere | Moovs | LuxeRide Phase 2 |
|---|---|---|---|
| Driver app | Incluida (básica) | Incluida | Incluida — premium |
| Passenger app | **$199 + $99/mes** (solo gratis en plan $549) | **$499/mes + $1,000 setup** | **Incluida en Professional** |
| Idiomas | EN | EN | **EN / ES / PT** |
| Flight-aware pickups | Add-on | Plan alto | Incluido |

La passenger app que la competencia cobra como add-on caro, LuxeRide la
incluye — ese es el titular de ventas de Phase 2.

## Ventaja técnica acumulada

Las apps NO necesitan un backend nuevo. Reutilizan lo ya construido:
- **Supabase**: auth + RLS ya aíslan por empresa y rol (driver ve solo SUS
  viajes — policy `drivers_select_assigned_bookings` ya existe)
- **Realtime** ya habilitado en bookings → las apps se actualizan en vivo
- **Server actions equivalentes**: la lógica de avance de viaje
  (driverAdvanceTripAction), pricing y policies vive en el servidor
- **i18n**: los diccionarios EN/ES/PT se comparten con las apps
- **Flight tracking + tracking público**: ya operativos

## Sprint 0 — Fundaciones (1 semana)

1. **Tabla `device_tokens`** (user_id, expo_push_token, platform, last_seen)
   + migración RLS.
2. **Push notifications**: lib/notifications agrega canal `push` (Expo Push
   API — gratis, sin Firebase config compleja). Hooks ya existentes
   (driver_assigned, en_route, etc.) disparan push además de email/SMS.
3. **Monorepo**: `apps/mobile-driver` y `apps/mobile-passenger` (Expo +
   TypeScript + EAS Build), compartiendo `packages/database` y diccionarios.

## Sprint 1-2 — Driver App (la prioridad operativa)

Pantallas:
- **Hoy**: viajes asignados en timeline, próximo viaje destacado con cuenta
  regresiva, chip de vuelo (✈ AA1234 +45min) para pickups de aeropuerto.
- **Viaje activo**: botón gigante de avance (En ruta → Llegué → Iniciar →
  Completar — misma máquina de estados), navegación con 1 toque (Google
  Maps / Waze deep link), llamar o **WhatsApp** al pasajero.
- **Al completar**: registrar pago en efectivo recibido (recordManualPayment)
  + firma del pasajero en pantalla (e-signature ligera — gap competitivo).
- **Mis ganancias**: viajes completados, total del período (drivers.total_earnings).
- **Mis documentos**: subir licencia/seguro desde la cámara, alertas de
  vencimiento (cron ya existente alimenta el push).
- **Disponibilidad**: toggle disponible/ocupado (drivers.is_available — el
  dispatch board ya lo refleja).

Diferenciadores vs competencia: UI dark premium (no utilitaria), trilingüe,
modo offline (cola de acciones cuando no hay señal — crítico en aeropuertos
con mala recepción), 100% sin entrenamiento (4 botones).

## Sprint 3-4 — Passenger App (white-label)

Modelo: **una app "LuxeRide"** en las stores donde el pasajero entra al
espacio de su empresa (deep link /book/[slug] → marca, colores y flota de
esa empresa). Build dedicado con marca propia = upsell Enterprise (EAS lo
permite por config).

Pantallas:
- **Reservar**: el wizard actual nativo (4 pasos, propina, Apple/Google Pay
  vía Stripe checkout sheet).
- **Mi viaje**: tracking en vivo en mapa (posición del driver — requiere
  agregar update de ubicación del driver app cada 30s a una tabla
  `driver_positions` con Realtime).
- **Historial + recibos** (datos ya existen) y re-reservar en 1 toque.
- **Post-viaje**: calificación + propina post-pago (bookings.rating ya
  existe; cierra otro gap competitivo: reviews).
- **Corporativo**: si el usuario es corporate_user, reserva contra su cuenta
  con sus límites (lógica ya construida).

## Sprint 5 — Pulido + lanzamiento

- EAS Build + TestFlight/Play Internal → producción.
- Página /apps en el landing con QR codes.
- Push de re-engagement ("¿Viajas pronto? Reserva tu traslado").

## Decisiones tomadas

- **Expo + React Native** (ya planificado) — un codebase, dos stores.
- **Sin API REST nueva**: las apps hablan directo con Supabase (anon key +
  RLS) y con las server actions vía fetch a route handlers ligeros solo
  donde haga falta (pagos).
- **Driver app primero**: es la que vende a los operadores (su dolor diario);
  la passenger app es el diferenciador de pricing vs Moovs/LA.
