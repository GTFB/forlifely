import { LANGUAGES, PROJECT_SETTINGS } from '@/settings';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


const locales = LANGUAGES.map(l=>l.code);
const defaultLocale = PROJECT_SETTINGS.defaultLanguage; 

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname starts with default locale - redirect to path without locale
  if (pathname === `/${defaultLocale}`) {
    // Redirect /en to /
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (pathname.startsWith(`/${defaultLocale}/`)) {
    // Redirect /en/... to /...
    const pathWithoutLocale = pathname.slice(`/${defaultLocale}`.length);
    return NextResponse.redirect(new URL(pathWithoutLocale || '/', request.url));
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return; 

  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(request.nextUrl);
}

export const config = {
  matcher: ['/((?!api|images|site.webmanifest|_next/static|_next/image|favicon.ico).*)'],
};