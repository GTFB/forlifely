"use client";

import { useRouter, usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/packages/components/ui/popover";
import { useLocale } from "@/hooks/use-locale";
import { LANGUAGES } from "@/settings";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function LanguageSwitcher({ 
  variant = "ghost", 
  size = "sm",
  className 
}: { 
  variant?: "default" | "ghost" | "outline"; 
  size?: "sm" | "default";
  className?: string;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [cookieLocale, setCookieLocale] = useState<string | null>(null);
  
  // Get cookie locale on mount and when pathname changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; neuropublisher-locale=`);
      const cookie = parts.length === 2 ? parts.pop()?.split(';').shift() || null : null;
      setCookieLocale(cookie);
    }
  }, [pathname]);
  
  // Also check cookie on every render to ensure we have the latest value
  const getCookieLocaleSync = () => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; payde-locale=`);
    return parts.length === 2 ? parts.pop()?.split(';').shift() || null : null;
  };
  
  const currentCookieLocale = getCookieLocaleSync();

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) {
      return;
    }

    // Get current path without locale
    let pathWithoutLocale = pathname;
    // Check if current path has any locale prefix (including /en/)
    for (const loc of ['en', 'de', 'fr', 'es', 'ua']) {
      if (pathname.startsWith(`/${loc}/`)) {
        pathWithoutLocale = pathname.slice(`/${loc}`.length);
        break;
      } else if (pathname === `/${loc}`) {
        pathWithoutLocale = '/';
        break;
      }
    }
    
    // Ensure path starts with /
    if (!pathWithoutLocale.startsWith('/')) {
      pathWithoutLocale = `/${pathWithoutLocale}`;
    }
    
    // Build new path with locale
    let newPath: string;
    if (newLocale === 'en') {
      // For English, remove locale prefix (no /en/ prefix)
      newPath = pathWithoutLocale === '/' ? '/' : pathWithoutLocale;
    } else {
      // For other locales, add locale prefix
      newPath = pathWithoutLocale === '/' ? `/${newLocale}` : `/${newLocale}${pathWithoutLocale}`;
    }
    
    // Update cookie
    document.cookie = `neuropublisher-locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    
    // Navigate to new path using window.location for full page reload
    // This ensures middleware processes the new locale correctly
    window.location.href = newPath;
  };

  // Determine locale from pathname first, then fallback to cookie
  // Use the locale from the hook as the primary source
  let detectedLocale: string = locale || 'en';
  
  // Also check pathname for locale prefix (excluding 'en' which has no prefix)
  const pathnameLower = pathname.toLowerCase();
  let hasLocalePrefix = false;
  for (const loc of ['de', 'fr', 'es', 'ua']) {
    if (pathnameLower === `/${loc}` || pathnameLower.startsWith(`/${loc}/`)) {
      detectedLocale = loc;
      hasLocalePrefix = true;
      break;
    }
  }
  
  // If no locale prefix in URL, use cookie if available
  // This ensures the active tab moves to the correct language
  if (!hasLocalePrefix) {
    // Use current cookie value (synchronously read) or fallback to state
    const activeCookie = currentCookieLocale || cookieLocale;
    if (activeCookie && ['de', 'fr', 'es', 'ua', 'en'].includes(activeCookie.toLowerCase())) {
      detectedLocale = activeCookie.toLowerCase();
    } else if (!locale || locale === 'en') {
      // Only default to 'en' if no cookie is set and locale from hook is 'en' or undefined
      detectedLocale = 'en';
    }
  }
  
  // Normalize locale to ensure consistent comparison
  const normalizedLocale = detectedLocale.toLowerCase().trim();
  
  const currentLanguage = LANGUAGES.find(lang => lang.code.toLowerCase() === normalizedLocale) || LANGUAGES[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={cn("gap-2", className)}
          aria-label="Select language"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.shortName}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="min-w-[120px] z-[1000] p-1" side="bottom">
        <div className="flex flex-col">
          {LANGUAGES.map((language) => {
            // Strict comparison: only match if codes are exactly equal (case-insensitive)
            const languageCode = language.code.toLowerCase().trim();
            // Check if this language matches the detected locale
            const isActive = normalizedLocale === languageCode;
            
            return (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={cn(
                  "relative flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                  isActive
                    ? "bg-muted/50 font-medium" 
                    : ""
                )}
              >
                <span>{language.name}</span>
                <span className="text-muted-foreground text-xs ml-2">{language.shortName}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

