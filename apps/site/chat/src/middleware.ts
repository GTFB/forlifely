import { NextRequest, NextResponse } from 'next/server';

const LOCALE_COOKIE = 'neuropublisher-locale';
const DEFAULT_LOCALE = 'en';
const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'es', 'ua'];

// Paths that should be excluded from locale detection
const EXCLUDED_PATHS = [
  '/api',
  '/admin',
  '/login',
  '/_next',
  '/images',
  '/favicon.ico',
  '/site.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
];

function shouldExcludePath(pathname: string): boolean {
  return EXCLUDED_PATHS.some(path => pathname.startsWith(path));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for excluded paths
  if (shouldExcludePath(pathname)) {
    return NextResponse.next();
  }

  // Check if path already has locale prefix
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  // Get locale from cookie, default to English
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const preferredLocale = cookieLocale || DEFAULT_LOCALE;

  // If path already has locale, continue
  if (pathnameHasLocale) {
    let detectedLocale = 'en';
    for (const loc of ['de', 'fr', 'es', 'ua']) {
      if (pathname.startsWith(`/${loc}`)) {
        detectedLocale = loc;
        break;
      }
    }
    
    // If path is /en or /en/, redirect to path without /en prefix
    if (pathname === '/en' || pathname === '/en/') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      const response = NextResponse.redirect(url);
      response.headers.set('x-locale', 'en');
      response.cookies.set(LOCALE_COOKIE, 'en', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
      return response;
    }
    
    // If path starts with /en/, redirect to path without /en prefix
    if (pathname.startsWith('/en/')) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice('/en'.length);
      const response = NextResponse.redirect(url);
      response.headers.set('x-locale', 'en');
      response.cookies.set(LOCALE_COOKIE, 'en', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
      return response;
    }
    
    const response = NextResponse.next();
    // Set locale header for layout
    response.headers.set('x-locale', detectedLocale);
    // Update cookie if needed
    if (!cookieLocale || cookieLocale !== detectedLocale) {
      response.cookies.set(LOCALE_COOKIE, detectedLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }
    return response;
  }

  // If no locale in path and user has a non-English cookie, redirect to that locale
  if (cookieLocale && cookieLocale !== 'en' && SUPPORTED_LOCALES.includes(cookieLocale) && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${cookieLocale}`;
    const response = NextResponse.redirect(url);
    response.headers.set('x-locale', cookieLocale);
    return response;
  }

  // For other paths without locale, continue (default to EN, no prefix)
  const response = NextResponse.next();
  response.headers.set('x-locale', DEFAULT_LOCALE);
  if (!cookieLocale) {
    response.cookies.set(LOCALE_COOKIE, DEFAULT_LOCALE, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

