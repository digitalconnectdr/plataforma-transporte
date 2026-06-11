// ── i18n — configuración base ──────────────────────────────────────────────────

export const LOCALES = ['en', 'es', 'pt'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en' // mercado principal: EE.UU.

export const LOCALE_COOKIE = 'luxeride_locale'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value)
}
