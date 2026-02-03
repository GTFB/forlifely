export const PROJECT_SETTINGS = {
  name: 'Altrp',
  description: 'The first truly open operating system for SMBs. Combine a rock-solid digital foundation with AI agents and modular plugins while maintaining total data and API sovereignty.',
  defaultLanguage: 'en',
  defaultTheme: 'light' as 'light' | 'dark',
  supportedThemes: ['light', 'dark',],
} as const;

export const LAYOUT_CONFIG = {
  containerWidth: '1440px',
} as const;

export const LANGUAGES = [
  { code: 'en', name: 'English', shortName: 'EN' },
  // { code: 'zh', name: '中文', shortName: 'CN' },
  // { code: 'hi', name: 'हिन्दी', shortName: 'IN' },
  // { code: 'es', name: 'Español', shortName: 'ES' },
  // { code: 'fr', name: 'Français', shortName: 'FR' },
  // { code: 'ar', name: 'العربية', shortName: 'AR' },
  // { code: 'pt', name: 'Português', shortName: 'PT' },
  { code: 'ru', name: 'Русский', shortName: 'RU' },
  // { code: 'ja', name: '日本語', shortName: 'JP' },
  // { code: 'de', name: 'Deutsch', shortName: 'DE' },
  // { code: 'ko', name: '한국어', shortName: 'KR' },
  // { code: 'it', name: 'Italiano', shortName: 'IT' },
  // { code: 'rs', name: 'Srpski', shortName: 'RS' },
] as const;

export const SUPPORTED_LANGUAGES: string[] = LANGUAGES.map(lang => lang.code);

export const CMS_PROVIDER: 'mdx' | 'sqlite' = 'sqlite'

export const APP_DB_CLIENT: 'sqlite' | 'postgres' = 'sqlite'