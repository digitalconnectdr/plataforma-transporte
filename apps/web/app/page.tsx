import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'LuxeRide — Plataforma para empresas de transporte premium',
  description:
    'Software todo-en-uno para empresas de transporte de lujo: reservaciones online, dispatch en tiempo real, pagos con Stripe, flota, conductores y cuentas corporativas. Powered by JPRS Digital Connect.',
}

export const revalidate = 300 // cache de 5 min — contenido casi estático

const FEATURES = [
  {
    n: '01',
    title: 'Motor de reservaciones',
    desc: 'Booking online de 4 pasos con precios calculados al instante: por milla, por hora, por zona o tarifa fija. Recargos nocturnos, de fin de semana y de aeropuerto aplicados automáticamente.',
  },
  {
    n: '02',
    title: 'Dispatch en tiempo real',
    desc: 'Board en vivo para asignar conductores y seguir cada viaje desde pendiente hasta completado. Tus clientes siguen su servicio con un link de tracking elegante.',
  },
  {
    n: '03',
    title: 'Pagos online',
    desc: 'Cobra con tarjeta vía Stripe: links de pago, depósitos, propinas y reembolsos. El dinero llega directo a tu cuenta con Stripe Connect.',
  },
  {
    n: '04',
    title: 'Flota y conductores',
    desc: 'Vehículos, documentos, licencias y disponibilidad de tu equipo en un solo lugar — con alertas automáticas antes de cada vencimiento.',
  },
  {
    n: '05',
    title: 'Cuentas corporativas',
    desc: 'Clientes empresariales con línea de crédito, límites por usuario, centros de costo y facturación automática a término.',
  },
  {
    n: '06',
    title: 'Reportes y auditoría',
    desc: 'Ingresos, performance de conductores, exports a CSV y un registro inmutable de cada operación crítica de tu empresa.',
  },
]

const STEPS = [
  {
    n: 'I',
    title: 'Configura tu empresa',
    desc: 'Crea tu cuenta, define zonas, tarifas, flota y equipo en minutos. Sin instalaciones ni hardware.',
  },
  {
    n: 'II',
    title: 'Comparte tu link de reservas',
    desc: 'Tus clientes reservan online con precios en vivo, desde cualquier dispositivo, con tu marca.',
  },
  {
    n: 'III',
    title: 'Opera y cobra',
    desc: 'Despacha en tiempo real, notifica por email y SMS, y recibe los pagos automáticamente.',
  },
]

const STATS = [
  { value: '5', label: 'Modelos de tarifas' },
  { value: '9', label: 'Roles de equipo' },
  { value: '24/7', label: 'Reservas online' },
  { value: '100%', label: 'Multi-empresa' },
]

export default async function LandingPage() {
  // Empresas activas para el directorio de reservas
  const admin = createAdminClient()
  const { data: companies } = await admin
    .from('companies')
    .select('name, slug, city')
    .eq('status', 'active')
    .order('name')
    .limit(12)

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-white antialiased">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0c0b0a]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f3d9a4] to-[#c89b4f] flex items-center justify-center shadow-[0_0_18px_rgba(233,193,118,0.35)]">
              <span className="text-[#141313] font-playfair font-bold text-sm leading-none">L</span>
            </div>
            <div className="leading-tight">
              <span className="font-playfair text-lg font-semibold tracking-wide">LuxeRide</span>
              <p className="text-[8px] uppercase tracking-[0.25em] text-white/35">
                by JPRS Digital Connect
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="hidden md:block text-[13px] text-white/55 hover:text-[#e9c176] transition-colors">
              Plataforma
            </a>
            <a href="#how" className="hidden md:block text-[13px] text-white/55 hover:text-[#e9c176] transition-colors">
              Cómo funciona
            </a>
            <a href="#book" className="hidden md:block text-[13px] text-white/55 hover:text-[#e9c176] transition-colors">
              Reservar
            </a>
            <Link href="/auth/login" className="text-[13px] text-white/55 hover:text-white transition-colors">
              Iniciar sesión
            </Link>
            <Link
              href="/auth/signup"
              className="px-5 py-2.5 text-[13px] font-semibold bg-gradient-to-br from-[#f3d9a4] to-[#c89b4f] text-[#141313] rounded-full hover:opacity-90 transition-opacity"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Glow dorado de fondo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 45% at 50% -5%, rgba(233,193,118,0.14), transparent 70%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <span className="h-px w-10 bg-[#e9c176]/60" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#e9c176]">
              Software para transporte premium
            </p>
            <span className="h-px w-10 bg-[#e9c176]/60" />
          </div>

          <h1 className="font-playfair text-[2.6rem] leading-[1.1] sm:text-6xl sm:leading-[1.08] font-semibold max-w-4xl mx-auto">
            La experiencia de lujo que tus clientes esperan,
            <span className="block mt-2 italic font-medium bg-gradient-to-r from-[#f3d9a4] via-[#e9c176] to-[#c89b4f] bg-clip-text text-transparent">
              con la operación en piloto automático.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/55 max-w-2xl mx-auto mt-7 leading-relaxed">
            LuxeRide es la plataforma todo-en-uno para limusinas, traslados de aeropuerto
            y chóferes ejecutivos: reservaciones online, dispatch en vivo, pagos con tarjeta
            y cuentas corporativas — bajo tu propia marca.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-11">
            <Link
              href="/auth/signup"
              className="px-9 py-4 text-sm font-semibold bg-gradient-to-br from-[#f3d9a4] to-[#c89b4f] text-[#141313] rounded-full hover:opacity-90 transition-opacity shadow-[0_8px_30px_rgba(233,193,118,0.25)]"
            >
              Empieza gratis →
            </Link>
            <a
              href="#book"
              className="px-9 py-4 text-sm font-semibold border border-white/15 rounded-full hover:border-[#e9c176]/60 hover:text-[#e9c176] transition-colors"
            >
              ¿Vas a viajar? Reserva aquí
            </a>
          </div>

          {/* Stats band */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="bg-[#0c0b0a] px-6 py-6">
                <p className="font-playfair text-3xl font-semibold text-[#e9c176]">{s.value}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-2xl mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#e9c176] mb-4">
              La plataforma
            </p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-semibold leading-snug">
              Todo lo que tu operación necesita,
              <span className="italic text-white/60"> nada que no.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden">
            {FEATURES.map((f) => (
              <div
                key={f.n}
                className="group bg-[#0c0b0a] p-8 hover:bg-[#13110e] transition-colors"
              >
                <p className="font-playfair text-sm text-[#e9c176]/70 group-hover:text-[#e9c176] transition-colors">
                  {f.n}
                </p>
                <h3 className="font-playfair text-lg font-semibold mt-4 mb-3">{f.title}</h3>
                <p className="text-[13px] text-white/45 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Editorial quote ── */}
      <section className="border-t border-white/[0.06] relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(233,193,118,0.07), transparent 70%)',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <span className="font-playfair text-6xl text-[#e9c176]/40 leading-none">&ldquo;</span>
          <p className="font-playfair text-2xl sm:text-3xl italic font-medium leading-relaxed text-white/85 -mt-4">
            El lujo está en los detalles: la confirmación instantánea, el chofer puntual,
            el recibo impecable. LuxeRide se encarga de todos.
          </p>
          <div className="mt-8 inline-flex items-center gap-3">
            <span className="h-px w-8 bg-[#e9c176]/50" />
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">
              JPRS Digital Connect
            </p>
            <span className="h-px w-8 bg-[#e9c176]/50" />
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section id="how" className="border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#e9c176] mb-4">
              Cómo funciona
            </p>
            <h2 className="font-playfair text-3xl sm:text-4xl font-semibold">
              En producción en tres pasos
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <span className="hidden sm:block absolute top-7 left-[60%] w-[80%] h-px bg-gradient-to-r from-[#e9c176]/40 to-transparent" />
                )}
                <div className="relative w-14 h-14 rounded-full border border-[#e9c176]/50 bg-[#0c0b0a] flex items-center justify-center mx-auto mb-6">
                  <span className="font-playfair text-lg font-semibold text-[#e9c176]">{s.n}</span>
                </div>
                <h3 className="font-playfair text-lg font-semibold mb-3">{s.title}</h3>
                <p className="text-[13px] text-white/45 leading-relaxed max-w-[260px] mx-auto">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Directorio de reservas ── */}
      <section id="book" className="border-t border-white/[0.06] bg-[#0a0908]">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#e9c176] mb-4">
            Para viajeros
          </p>
          <h2 className="font-playfair text-3xl sm:text-4xl font-semibold mb-4">
            Reserva tu próximo traslado
          </h2>
          <p className="text-white/45 mb-12 max-w-xl mx-auto text-sm leading-relaxed">
            Estas empresas operan con LuxeRide. Reserva online con precios al instante
            y confirmación inmediata.
          </p>
          {!companies?.length ? (
            <p className="text-sm text-white/35">
              Pronto habrá empresas disponibles para reservar online.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((c) => (
                <Link
                  key={c.slug}
                  href={`/book/${c.slug}`}
                  className="group bg-white/[0.025] border border-white/[0.08] rounded-2xl px-7 py-6 hover:border-[#e9c176]/50 hover:bg-white/[0.04] transition-all text-left"
                >
                  <p className="font-playfair font-semibold text-base">{c.name}</p>
                  <p className="text-xs text-white/35 mt-2 group-hover:text-[#e9c176] transition-colors">
                    {c.city ? `${c.city} · ` : ''}Reservar online →
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="border-t border-white/[0.06] relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 70% at 50% 110%, rgba(233,193,118,0.12), transparent 70%)',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 py-28 text-center">
          <h2 className="font-playfair text-3xl sm:text-5xl font-semibold leading-tight">
            Eleva tu operación
            <span className="block italic font-medium bg-gradient-to-r from-[#f3d9a4] via-[#e9c176] to-[#c89b4f] bg-clip-text text-transparent mt-2">
              al nivel de tu servicio.
            </span>
          </h2>
          <p className="text-white/45 mt-6 mb-10 text-sm sm:text-base">
            Crea tu cuenta y recibe tu primera reservación online esta misma semana.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-10 py-4 text-sm font-semibold bg-gradient-to-br from-[#f3d9a4] to-[#c89b4f] text-[#141313] rounded-full hover:opacity-90 transition-opacity shadow-[0_8px_30px_rgba(233,193,118,0.25)]"
          >
            Crear cuenta gratis →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f3d9a4] to-[#c89b4f] flex items-center justify-center">
                <span className="text-[#141313] font-playfair font-bold text-[10px] leading-none">L</span>
              </div>
              <span className="font-playfair text-sm font-semibold">LuxeRide</span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#e9c176]/70">
              LuxeRide — Powered by JPRS Digital Connect
            </p>
            <p className="text-[11px] text-white/30">
              © {new Date().getFullYear()} Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
