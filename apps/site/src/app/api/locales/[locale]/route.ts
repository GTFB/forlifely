import { NextRequest, NextResponse } from 'next/server'

// For static export, we need to configure this route
export const dynamic = 'force-static'
export const dynamicParams = true

export async function generateStaticParams() {
  // Return supported locales for static generation
  return [{ locale: 'ru' }, { locale: 'en' }]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  try {
    const { locale } = await params
    
    if (locale !== 'en' && locale !== 'ru') {
      return NextResponse.json(
        { error: 'Invalid locale. Supported locales: en, ru' },
        { status: 400 }
      )
    }

    // Use dynamic import to load JSON files
    let translations
    try {
      if (locale === 'ru') {
        const module = await import('@/packages/content/locales/ru.json')
        translations = module.default || module
      } else {
        const module = await import('@/packages/content/locales/en.json')
        translations = module.default || module
      }
      
      return NextResponse.json(translations, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      })
    } catch (fileError) {
      console.error(`Failed to import locale file for ${locale}:`, fileError)
      return NextResponse.json(
        { error: 'Locale file not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error in locales API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

