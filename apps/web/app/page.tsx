import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'LuxeRide — Plataforma para empresas de transporte premium',
  description:
    'Software todo-en-uno para empresas de transporte de lujo: reservaciones online, dispatch en tiempo real, pagos con Stripe, flota, conductores y cuentas corporativas.',
}

export const revalidate = 300 // cache de 5 min — contenido casi estático

const FEATURES = [
  {
    icon: '🗓️',
    title: 'Motor de reservaciones',
    desc: 'Booking online de 4 pasos con precios calculados al instante: por milla, hora, zona o tarifa fija.',
  },
  {
    icon: '📡',
    title: 'Dispatch en tiempo real',
    desc: 'Board en vivo para asignar conductores y seguir cada viaje desde pendiente hasta completado.',
  },
  {
    icon: '💳',
    title: 'Pagos online',
    desc: 'Cobra con tarjeta vía Stripe. Links de pago, reembolsos y depósitos directo a tu cuenta con Stripe Connect.',
  },
  {
    icon: '🚙',
    title: 'Flota y conductores',
    desc: 'Gestiona vehículos, documentos, licencias y disponibilidad de tu equipo en un solo lugar.',
  },
  {
    icon: '🏢',
    title: 'Cuentas corporativas',
    desc: 'Clientes empresariales con crédito, límites por usuario, centros de costo y facturación a término.',
  },
  {
    icon: '📊',
    title: 'Reportes y auditoría',
    desc: 'Ingresos, performance de conductores, exports a CSV y registro inmutable de cada operación.',
  },
]

const STEPS = [
  { n: '1', title: 'Configura tu empresa', desc: 'Crea tu cuenta, define zonas, tarifas, flota y equipo en minutos.' },
  { n: '2', title: 'Comparte tu link de reservas', desc: 'Tus clientes reservan online con precios en vivo desde cualquier dispositivo.' },
  { n: '3', title: 'Opera y cobra', desc: 'Despacha en tiempo real, notifica por email/SMS y recibe pagos automáticamente.' },
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
    <div className="min-h-screen bg-[#141313] text-white">
      {/* ── Nav ── */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#e9c176] flex items-center justify-center">
              <span className="text-gray-900 font-bold text-xs leading-none">L</span>
            </div>
            <span className="font-playfair text-lg font-semibold">LuxeRide</span>
          </div>
          <nav className="flex items-center gap-5">
            <a href="#features" className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors">
              Características
            </a>
            <a href="#how" className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors">
              Cómo funciona
            </a>
            <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">
              Iniciar sesión
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 text-sm font-semibold bg-[#e9c176] text-gray-900 rounded-xl hover:bg-[#e9c176]/90 transition-colors"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#e9c176] mb-6">
          Software para transporte premium
        </p>
        <h1 className="font-playfair text-4xl sm:text-6xl font-semibold leading-tight max-w-3xl mx-auto">
          Tu empresa de transporte de lujo,{' '}
          <span className="text-[#e9c176]">en piloto automático</span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto mt-6">
          Reservaciones online, dispatch en tiempo real, pagos con tarjeta y cuentas
          corporativas — todo en una sola plataforma multi-empresa.
        </p>
        <div className="flex items-center justify-center gap-4 mt-10">
          <Link
            href="/auth/signup"
            className="px-7 py-3.5 text-sm font-semibold bg-[#e9c176] text-gray-900 rounded-2xl hover:bg-[#e9c176]/90 transition-colors"
          >
            Empieza gratis →
          </Link>
          <a
            href="#book"
            className="px-7 py-3.5 text-sm font-semibold border border-white/20 rounded-2xl hover:border-[#e9c176] hover:text-[#e9c176] transition-colors"
          >
            ¿Vas a viajar?
          </a>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="font-playfair text-3xl font-semibold text-center mb-3">
            Todo lo que tu operación necesita
          </h2>
          <p className="text-white/50 text-center mb-14">
            Diseñado para limusinas, traslados de aeropuerto, chóferes ejecutivos y flotas premium.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-[#e9c176]/40 transition-colors"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="font-semibold text-base mt-4 mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section id="how" className="border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="font-playfair text-3xl font-semibold text-center mb-14">
            En producción en 3 pasos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#e9c176] text-gray-900 font-playfair font-bold text-xl flex items-center justify-center mx-auto mb-5">
                  {s.n}
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Directorio de reservas ── */}
      <section id="book" className="border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="font-playfair text-3xl font-semibold mb-3">¿Vas a viajar?</h2>
          <p className="text-white/50 mb-10">
            Reserva directamente con una de las empresas que operan en LuxeRide.
          </p>
          {!companies?.length ? (
            <p className="text-sm text-white/40">
              Pronto habrá empresas disponibles para reservar online.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((c) => (
                <Link
                  key={c.slug}
                  href={`/book/${c.slug}`}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 hover:border-[#e9c176]/40 transition-colors text-left"
                >
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {c.city ? `${c.city} · ` : ''}Reservar online →
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="font-playfair text-3xl sm:text-4xl font-semibold">
            Eleva tu operación hoy
          </h2>
          <p className="text-white/50 mt-4 mb-8">
            Crea tu cuenta y recibe tu primera reservación online esta misma semana.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 text-sm font-semibold bg-[#e9c176] text-gray-900 rounded-2xl hover:bg-[#e9c176]/90 transition-colors"
          >
            Crear cuenta gratis →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#e9c176] flex items-center justify-center">
              <span className="text-gray-900 font-bold text-[9px] leading-none">L</span>
            </div>
            <span className="font-playfair text-sm font-semibold">LuxeRide</span>
          </div>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} LuxeRide. Plataforma multi-tenant para transporte premium.
          </p>
        </div>
      </footer>
    </div>
  )
}
