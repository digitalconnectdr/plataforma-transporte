'use client'
// ── Selector de idioma — setea cookie y refresca el render del servidor ───────

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, type Locale } from '@/lib/i18n/config'

const FLAGS: Record<Locale, string> = { en: '🇺🇸', es: '🇪🇸', pt: '🇧🇷' }

export function LanguageSwitcher({
  current,
  variant = 'dark',
}: {
  current: Locale
  variant?: 'dark' | 'light'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const locale = e.target.value
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
    startTransition(() => router.refresh())
  }

  const cls =
    variant === 'dark'
      ? 'bg-transparent border border-white/15 text-white/70 hover:border-[#e9c176]/60'
      : 'bg-white border border-gray-200 text-gray-600 hover:border-[#e9c176]'

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={isPending}
      aria-label="Language"
      className={`text-xs rounded-full px-2.5 py-1.5 cursor-pointer focus:outline-none transition-colors disabled:opacity-50 ${cls}`}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l} className="text-gray-900">
          {FLAGS[l]} {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  )
}
