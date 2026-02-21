export const PROJECT_SETTINGS = {
  name: 'Lifely',
  description: 'Feel supported with Lifely. We match you with a mentor who has lived with diabetes and helps you set small, doable goals—so managing your health feels clear and manageable every day.',
  defaultLanguage: 'en',
  defaultTheme: 'light' as 'light' | 'dark',
  supportedThemes: ['light', 'dark',],
} as const;

export const LAYOUT_CONFIG = {
  containerWidth: '1280px',
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

// Private role-based routes that don't use locale prefix (from (private) folder)
export const PRIVATE_ROLE_ROUTES = [
  'a', // admin alternative routes
  'c', // consumer routes
  'd', // dealer routes
  'i', // investor routes
  'm', // manager routes
  'member', // member routes
  'mentor', // mentor routes
  'p', // partner routes
  's', // storekeeper routes
  't', // task routes
] 

export const CMS_PROVIDER: 'mdx' | 'sqlite' = 'sqlite'

export const APP_DB_CLIENT: 'sqlite' | 'postgres' = 'sqlite'