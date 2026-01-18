import { PROJECT_SETTINGS, LANGUAGES } from "@/settings"
export const supportedLanguageCodes = LANGUAGES.map(lang => lang.code)
export type LanguageCode = (typeof LANGUAGES)[number]['code']


  // Compute initial value
  export const getInitialLocale = (): LanguageCode => {
    // Use PROJECT_SETTINGS.defaultLanguage, but ensure it's in LANGUAGES
    const defaultLang = PROJECT_SETTINGS.defaultLanguage
    if (supportedLanguageCodes.includes(defaultLang as LanguageCode)) {
      return defaultLang as LanguageCode
    }
    // Fallback to first available language
    return LANGUAGES[0]?.code || 'en'
  }