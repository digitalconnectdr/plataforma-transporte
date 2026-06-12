# LuxeRide — Estado y pendientes

> Actualizado: 2026-06-11. Para retomar el trabajo, leer este archivo +
> docs/COMPETITIVE-ANALYSIS.md + docs/PHASE-2-MOBILE.md.

## ✅ Completado (Phase 1 + mejoras)

- F1.0–F1.17 completos (ver SETUP.md): booking engine, dispatch realtime,
  Stripe Connect + checkout + depósitos + propinas, policy engine,
  corporate + facturación automática (cron), notificaciones email/SMS
  (HTML brandeado), reports + audit (paginado 50), tracking público,
  flight tracking (AeroDataBox activo / FlightAware listo), multi-stop,
  pagos manuales (cash/Zelle/transferencia), seed demo.
- Tema Ivory en todo el sistema + sidebar colapsable con íconos + favicon.
- Landing premium con fotos de flota, animaciones, pricing, FAQ, trilingüe.
- i18n EN/ES/PT: landing, wizard, tracking, pagos, auth chrome, nav admin,
  y chrome de Fleet/Zones/Airports/Team/Pricing/Settings + formularios
  cliente (tipos de vehículo, estados, roles de equipo).
- Tooltips explicativos (InfoTip) en Aeropuertos y Reglas de precio.
- Aeropuertos personalizados (alta manual con IATA).
- Panel /super-admin/subscriptions: solicitudes pendientes (aprobar/
  rechazar), renovaciones +1/+3/+12 meses, plan editable, vencimientos.
- Bloqueo real de usuarios (is_active en middleware + login) y banner.
- Reset de contraseña: ya existía ("Forgot password?" en login).
- Tests Vitest (29) en CI. Fix crash Stripe Connect. Fix timezone recargos.
- Google Maps funcionando (faltaba habilitar Maps JS/Places/Routes API).
- **Signup arreglado** (2026-06-11): handle_new_user() sin search_path fijo
  hacía fallar a GoTrue con "Database error creating new user". Fix aplicado
  en producción + migración 16. signupAction ahora confirma el email
  (email_confirm: true) y hace auto-login al dashboard.
- GA4 + Search Console + sitemap.xml + robots.txt (faltan las 2 env vars).
- **Producción viva**: main ahora contiene todo develop (historias unidas
  con merge -s ours). Push a main = deploy de producción en
  https://luxeride.vercel.app (público, sin login de Vercel).

## ⬜ Pendientes del USUARIO (configuración)

1. **Google Analytics + Search Console**: crear propiedad GA4 → env var
   NEXT_PUBLIC_GA_MEASUREMENT_ID; verificación HTML tag de Search Console →
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION; redeploy y enviar
   https://luxeride.vercel.app/sitemap.xml en Search Console.
2. (Opcional) Vercel → Settings → Deployment Protection → desactivar
   "Vercel Authentication" si se quiere compartir previews de develop sin
   login de Vercel. Producción (luxeride.vercel.app) ya es pública.
3. **Vercel env vars** (opcionales, activan features): RESEND_API_KEY +
   RESEND_FROM_EMAIL (key ya existe, dominio por verificar en resend.com),
   CRON_SECRET (facturación corporativa + alertas de documentos),
   UPSTASH_REDIS_REST_URL/TOKEN (rate limit distribuido).
4. **Stripe real** cuando haya clientes: keys + webhook
   (/api/stripe/webhook) + habilitar Connect en dashboard.stripe.com.
5. **Twilio** (SMS) cuando se quiera activar.
6. Probar /super-admin/subscriptions con el usuario super_admin.

## ⬜ Backlog de DESARROLLO (próximas sesiones, en orden sugerido)

1. **2ª pasada i18n** (~1 sesión): conectar al diccionario las páginas
   nativas en español para EN/PT — bookings lista/detalle/nueva, dispatch
   board (columnas/acciones), reports, audit, corporate, driver/account,
   login/signup completos, secciones policy/payments de Settings,
   formulario nuevo vehículo, detalles de conductor/vehículo.
2. **Widget de reservas embebible** (~1 sesión): iframe/script del wizard
   para incrustar en el sitio web de cada operador.
3. **Reviews post-viaje**: email al completar con link de calificación
   (bookings.rating ya existe) — cierra gap competitivo.
4. **Pipeline de cotizaciones**: UI de quotes + follow-up automático de
   cotizaciones abandonadas (Moovs-style).
5. **Notificar al super admin** (email) cuando entra una solicitud nueva
   desde el landing + cron aviso de suscripciones por vencer.
6. **Fase 2 móvil** (driver app primero) — plan en docs/PHASE-2-MOBILE.md.
7. Gaps mayores: QuickBooks, e-signatures, farm-in/farm-out, promo codes,
   detección de conflictos de vehículo, nómina de conductores, WhatsApp.

## Datos operativos

- Deploy: push a develop → preview (requiere login de Vercel salvo que se
  desactive Deployment Protection); push a main → PRODUCCIÓN
  (https://luxeride.vercel.app, pública). Para promover: merge develop→main.
- Migraciones: SQL Editor de Supabase (proyecto iwjtjwryhtpzuvwmlpjk) o
  `supabase db push`.
- Flujo de solicitudes: signup del landing crea empresa en `trial` →
  aparece en /super-admin/subscriptions → Aprobar la activa con 1 mes.
- Tests: `npm test` (raíz). Build: `npx next build` en apps/web.
