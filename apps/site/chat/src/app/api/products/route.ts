/// <reference types="@cloudflare/workers-types" />

import { buildRequestEnv } from '@/shared/env'
import { ProductsRepository } from '@/shared/repositories/products.repository'
import { parseJson } from '@/shared/repositories/utils'

/**
 * GET /api/products
 * Returns list of published products
 */
export async function GET(request: Request) {
  const env = buildRequestEnv()
  const url = new URL(request.url)
  
  // Pagination parameters
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const pageSize = Math.max(1, Math.min(10000, Number(url.searchParams.get('pageSize') || 20)))
  
  // Filter parameters
  const category = url.searchParams.get('category') || null
  const search = url.searchParams.get('search') || null
  const topSales = url.searchParams.get('topSales') === 'true'

  try {
    // Check if DB binding exists
    if (!env.DB) {
      throw new Error('Database binding is not configured')
    }

    const repository = ProductsRepository.getInstance(env.DB)

    // Build filters for published products
    // deletedAt filter is added automatically in ProductsRepository.getFiltered
    const filterConditions = [
      {
        field: 'statusName',
        operator: 'eq' as const,
        values: ['PUBLISHED'],
      },
    ]

    // Add category filter if provided
    if (category) {
      filterConditions.push({
        field: 'category',
        operator: 'eq' as const,
        values: [category],
      })
    }

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

    // Get all products first (without pagination) to apply JSON filters
    // We need to filter by topSales before pagination
    // Use a reasonable limit to avoid memory issues
    const allProductsResult = await repository.getFiltered(
      filters, 
      orders, 
      { page: 1, limit: 10000 } // Get products in batches if needed
    )

    // Apply additional filters that can't be done via SQL (search in JSON, topSales)
    let filteredDocs = allProductsResult.docs

    if (search) {
      const searchLower = search.toLowerCase()
      filteredDocs = filteredDocs.filter((product) => {
        // Search in category
        if (product.category?.toLowerCase().includes(searchLower)) {
          return true
        }
        
        // Search in title (might be JSON)
        let titleText = ''
        if (product.title) {
          if (typeof product.title === 'string') {
            try {
              const parsed = JSON.parse(product.title)
              titleText = typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed)
            } catch {
              titleText = product.title
            }
          } else {
            titleText = JSON.stringify(product.title)
          }
        }
        
        return titleText.toLowerCase().includes(searchLower)
      })
    }

    if (topSales) {
      filteredDocs = filteredDocs.filter((product) => {
        // Handle dataIn - it might be already parsed (object) or a string
        let dataIn: Record<string, unknown> = {}
        if (product.dataIn) {
          if (typeof product.dataIn === 'string') {
            try {
              let parsed = JSON.parse(product.dataIn)
              // Handle double-encoded JSON strings (when JSON is stored as escaped string)
              if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('['))) {
                try {
                  parsed = JSON.parse(parsed)
                } catch {
                  // If second parse fails, use first parse result
                }
              }
              dataIn = parsed
            } catch {
              dataIn = {}
            }
          } else if (typeof product.dataIn === 'object' && product.dataIn !== null) {
            dataIn = product.dataIn as Record<string, unknown>
          }
        }
        
        // Check for topSales as boolean true or string "true" or number 1
        const topSalesValue = dataIn.topSales
        const isTopSales = topSalesValue === true || topSalesValue === 'true' || topSalesValue === 1 || topSalesValue === '1'
        
        return isTopSales
      })
    }

    // Apply pagination after filtering
    const total = filteredDocs.length
    const totalPages = Math.ceil(total / pageSize)
    const offset = (page - 1) * pageSize
    const paginatedDocs = filteredDocs.slice(offset, offset + pageSize)
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Products API:', {
        category,
        allProductsCount: allProductsResult.docs.length,
        filteredCount: filteredDocs.length,
        total,
        page,
        pageSize,
        returning: paginatedDocs.length,
      });
    }

    // Parse JSON fields for response
    const processedProducts = paginatedDocs.map((product) => {
      const processed: any = { ...product }
      
      // Parse JSON fields if they are strings
      if (product.title && typeof product.title === 'string') {
        try {
          processed.title = JSON.parse(product.title)
        } catch {
          // Keep as string if not valid JSON
        }
      }
      
      if (product.gin && typeof product.gin === 'string') {
        try {
          processed.gin = JSON.parse(product.gin)
        } catch {
          // Keep as string if not valid JSON
        }
      }
      
      if (product.dataIn && typeof product.dataIn === 'string') {
        try {
          let parsed = JSON.parse(product.dataIn)
          // Handle double-encoded JSON strings (when JSON is stored as escaped string)
          if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('['))) {
            try {
              parsed = JSON.parse(parsed)
            } catch {
              // If second parse fails, use first parse result
            }
          }
          processed.dataIn = parsed
        } catch {
          // Keep as string if not valid JSON
        }
      }
      
      if (product.dataOut && typeof product.dataOut === 'string') {
        try {
          processed.dataOut = JSON.parse(product.dataOut)
        } catch {
          // Keep as string if not valid JSON
        }
      }

      return processed
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: processedProducts,
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
    console.error('Get products error:', error)
    
    // Check if it's a database connection error
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    const isDbError = errorMessage.includes('D1') || errorMessage.includes('database') || errorMessage.includes('binding')
    
    // Log full error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', {
        message: errorMessage,
        stack: errorStack,
        error: error
      })
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
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
