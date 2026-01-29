'use client'

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'es', 'ua'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

// Helper function to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Simple locale hook that detects locale from pathname and cookie
export function useLocale() {
  const pathname = usePathname();
  const [cookieLocale, setCookieLocale] = useState<string | null>(null);
  
  // Read cookie on mount and when pathname changes
  useEffect(() => {
    const cookie = getCookie('neuropublisher-locale');
    setCookieLocale(cookie);
  }, [pathname]);
  
  // Detect locale from pathname only (for UI display purposes)
  // Check if pathname starts with any supported locale prefix
  let locale: Locale = 'en'; // Default to English (no prefix means English)
  
  // Check for locale prefix in pathname (excluding 'en' which has no prefix)
  for (const loc of SUPPORTED_LOCALES) {
    if (loc === 'en') continue; // Skip 'en' as it's the default (no prefix)
    if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) {
      locale = loc;
      break; // Found a locale prefix, use it and stop searching
    }
  }
  
  // If no locale prefix found, default to 'en'
  // This ensures that only one locale is active at a time
  
  /**
   * Get localized path for a given path and locale
   * @param path - Path without locale prefix (e.g., "/catalog/marketing")
   * @param targetLocale - Target locale (defaults to current locale)
   * @returns Localized path (e.g., "/de/catalog/marketing" or "/catalog/marketing" for en)
   */
  const getLocalizedPath = useCallback((path: string, targetLocale: Locale = locale): string => {
    // Remove any existing locale prefix
    let cleanPath = path;
    for (const loc of SUPPORTED_LOCALES) {
      if (loc === 'en') continue;
      if (cleanPath.startsWith(`/${loc}/`)) {
        cleanPath = cleanPath.slice(`/${loc}`.length);
        break;
      } else if (cleanPath === `/${loc}`) {
        cleanPath = '/';
        break;
      }
    }
    
    // Ensure path starts with /
    if (!cleanPath.startsWith('/')) {
      cleanPath = `/${cleanPath}`;
    }
    
    // For English (default), return path without prefix
    if (targetLocale === 'en') {
      return cleanPath === '/' ? '/' : cleanPath;
    }
    
    // For other locales, add locale prefix
    return cleanPath === '/' ? `/${targetLocale}` : `/${targetLocale}${cleanPath}`;
  }, [locale]);
  
  /**
   * Get current path without locale prefix
   */
  const getPathWithoutLocale = useCallback((): string => {
    for (const loc of SUPPORTED_LOCALES) {
      if (loc === 'en') continue;
      if (pathname.startsWith(`/${loc}/`)) {
        return pathname.slice(`/${loc}`.length);
      } else if (pathname === `/${loc}`) {
        return '/';
      }
    }
    return pathname;
  }, [pathname]);
  
  return { 
    locale,
    getLocalizedPath,
    getPathWithoutLocale,
  };
}

