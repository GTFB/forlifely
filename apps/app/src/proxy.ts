import { LANGUAGES, PROJECT_SETTINGS } from '@/settings';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = LANGUAGES.map(l => l.code);
const defaultLocale = PROJECT_SETTINGS.defaultLanguage;

// Private routes that don't use locale prefix (from (private) folder)
const PRIVATE_ROUTES = [
  'login',
  'register',
  'reset-password',
  'verify-email',
  'confirm-email-change',
  'admin',
  'a', // admin alternative routes
  'c', // consumer routes
  'd', // dealer routes
  'i', // investor routes
  'm', // manager routes
  'p', // partner routes
  's', // storekeeper routes
  't', // task routes
  'media',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a private route (no locale)
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  const isPrivateRoute = firstSegment && PRIVATE_ROUTES.includes(firstSegment);

  // Private routes: don't add locale, pass through as-is
  if (isPrivateRoute) {
    return NextResponse.next();
  }

  // Redirect default locale to path without locale
  if (pathname === `/${defaultLocale}`) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith(`/${defaultLocale}/`)) {
    const pathWithoutLocale = pathname.slice(`/${defaultLocale}`.length);
    return NextResponse.redirect(new URL(pathWithoutLocale || '/', request.url));
  }

  // Check if pathname already has a non-default locale
  const pathnameHasNonDefaultLocale = locales.some(
    (locale) => locale !== defaultLocale && (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)
  );

  // If non-default locale is present, continue as normal
  if (pathnameHasNonDefaultLocale) {
    return NextResponse.next();
  }

  // If no locale, add default locale via rewrite (internal, URL stays the same)
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(request.nextUrl);
}

export const config = {
  matcher: ['/((?!api|images|site.webmanifest|_next/static|_next/image|favicon.ico).*)'],
};