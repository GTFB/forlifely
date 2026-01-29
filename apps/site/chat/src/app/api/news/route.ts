/// <reference types="@cloudflare/workers-types" />

import { buildRequestEnv } from '@/shared/env'
import { TextsRepository } from '@/shared/repositories/texts.repository'
import { parseJson } from '@/shared/repositories/utils'

/**
 * GET /api/news
 * Returns list of published news articles
 */
export async function GET(request: Request) {
  const env = buildRequestEnv()
  const url = new URL(request.url)
  
  // Pagination parameters
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('pageSize') || 20)))
  
  // Filter parameters
  const slug = url.searchParams.get('slug') || null

  try {
    // Check if DB binding exists
    if (!env.DB) {
      throw new Error('Database binding is not configured')
    }

    const repository = TextsRepository.getInstance(env.DB)

    // Build filters for published news articles
    // deletedAt filter is added automatically in TextsRepository.getFiltered
    // Only filter by type - statusName and isPublic will be filtered after getting results
    // to handle different case variations and NULL values
    const filterConditions = [
      {
        field: 'type',
        operator: 'eq' as const,
        values: ['news'],
      },
    ]

    const filters = {
      conditions: filterConditions,
    }

    // Build orders: order ASC, createdAt DESC
    const orders = {
      orders: [
        { field: 'order', direction: 'asc' as const },
        { field: 'createdAt', direction: 'desc' as const },
      ],
    }

    // Build pagination
    const pagination = {
      page,
      limit: pageSize,
    }

    // Get filtered texts
    const result = await repository.getFiltered(filters, orders, pagination)

    // Apply additional filters that can't be done via SQL (statusName, isPublic, slug in JSON)
    let filteredDocs = result.docs

    // Filter by statusName (published) - case insensitive
    filteredDocs = filteredDocs.filter((text) => {
      const status = text.statusName?.toLowerCase()
      return status === 'published'
    })

    // Filter by isPublic (allow TRUE or NULL, like original code: is_public = TRUE OR is_public IS NULL)
    filteredDocs = filteredDocs.filter((text) => {
      // Allow if isPublic is true, 1, or null/undefined
      return text.isPublic === true ||  text.isPublic == null
    })

    if (slug) {
      filteredDocs = filteredDocs.filter((text) => {
        const dataIn = parseJson<Record<string, unknown>>(text.dataIn, {})
        return dataIn.slug === slug
      })
    }

    // Recalculate pagination after filtering
    const total = filteredDocs.length
    const totalPages = Math.ceil(total / pageSize)
    const offset = (page - 1) * pageSize
    const paginatedDocs = filteredDocs.slice(offset, offset + pageSize)

    // Parse JSON fields for response
    const processedTexts = paginatedDocs.map((text) => {
      const processed: any = { ...text }
      
      // Parse JSON fields if they are strings
      if (text.dataIn && typeof text.dataIn === 'string') {
        try {
          processed.dataIn = JSON.parse(text.dataIn)
        } catch {
          // Keep as string if not valid JSON
        }
      }
      
      if (text.dataOut && typeof text.dataOut === 'string') {
        try {
          processed.dataOut = JSON.parse(text.dataOut)
        } catch {
          // Keep as string if not valid JSON
        }
      }
      
      if (text.gin && typeof text.gin === 'string') {
        try {
          processed.gin = JSON.parse(text.gin)
        } catch {
          // Keep as string if not valid JSON
        }
      }

      return processed
    })

    // If slug is provided, return single article or 404
    if (slug) {
      if (processedTexts.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Article not found',
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: processedTexts[0],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: processedTexts,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  } catch (error) {
    console.error('Get news error:', error)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isDbError = errorMessage.includes('D1') || errorMessage.includes('database') || errorMessage.includes('binding')
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch news',
        details: errorMessage,
        type: isDbError ? 'database_error' : 'unknown_error',
        hint: isDbError 
          ? 'Database may not be initialized. Run migrations or check database binding configuration.'
          : 'Check server logs for more details.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
