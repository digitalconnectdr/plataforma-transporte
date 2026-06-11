// ── i18n — helpers server-side ─────────────────────────────────────────────────
// Locale: cookie → Accept-Language → default (en).

import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config'
import { en, type Dictionary } from './dictionaries/en'
import { es } from './dictionaries/es'
import { pt } from './dictionaries/pt'

const DICTIONARIES: Record<Locale, Dictionary> = { en, es, pt }

export type { Dictionary, Locale }

export function getLocale(): Locale {
  // 1. Cookie explícita (la setea el LanguageSwitcher)
  const cookieValue = cookies().get(LOCALE_COOKIE)?.value
  if (isLocale(cookieValue)) return cookieValue

  // 2. Accept-Language del navegador
  const acceptLanguage = headers().get('accept-language') ?? ''
  for (const part of acceptLanguage.split(',')) {
    const lang = part.split(';')[0]?.trim().slice(0, 2).toLowerCase()
    if (isLocale(lang)) return lang
  }

  return DEFAULT_LOCALE
}

export function getDict(locale?: Locale): Dictionary {
  return DICTIONARIES[locale ?? getLocale()]
}
