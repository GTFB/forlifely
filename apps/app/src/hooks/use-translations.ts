"use client"

import { useEffect, useState } from "react"
import { i18n, type LanguageCode } from "@/lib/i18n"

export function useTranslations(locale?: LanguageCode) {
  const [translations, setTranslations] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [currentLocale, setCurrentLocale] = useState<LanguageCode>(
    locale || i18n.getCurrentLocale()
  )

  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true)
      try {
        const loaded = await i18n.loadTranslations(currentLocale)
        setTranslations(loaded)
      } catch (error) {
        console.error(`[useTranslations] Failed to load translations for ${currentLocale}:`, error)
      } finally {
        setIsLoading(false)
      }
    }
    loadTranslations()
  }, [currentLocale])

  const t = (key: string): string => {
    const keys = key.split('.')
    let current: any = translations
    for (const k of keys) {
      if (current == null || typeof current !== 'object') return key
      current = current[k]
    }
    if (typeof current === 'string') return current
    if (currentLocale !== 'en' && translations.pages) return key
    return key
  }

  return {
    t,
    locale: currentLocale,
    setLocale: (newLocale: LanguageCode) => {
      setCurrentLocale(newLocale)
      if (typeof window !== 'undefined') {
        localStorage.setItem('static-locale', newLocale)
      }
    },
    isLoading,
    translations,
  }
}
