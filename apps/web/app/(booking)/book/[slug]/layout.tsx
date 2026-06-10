import { MapsProvider } from '@/components/maps/maps-provider'

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header minimalista */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#d4af37] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-[10px] leading-none">L</span>
          </div>
          <span className="font-semibold text-[#1d1d1f] text-sm tracking-tight">LuxeRide</span>
        </div>
      </header>

      {/* Contenido — MapsProvider para AddressInput */}
      <MapsProvider>
        <main className="max-w-2xl mx-auto px-6 py-8">
          {children}
        </main>
      </MapsProvider>
    </div>
  )
}
