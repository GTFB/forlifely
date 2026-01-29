/// <reference types="@cloudflare/workers-types" />

import { buildRequestEnv } from '@/shared/env'
import { ProductsRepository } from '@/shared/repositories/products.repository'
import { parseJson } from '@/shared/repositories/utils'

/**
 * GET /api/products/:id
 * Returns product details by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = buildRequestEnv()
  const { id } = await params

  try {
    if (!env.DB) {
      throw new Error('Database binding is not configured')
    }

    const repository = ProductsRepository.getInstance(env.DB)
    const productId = parseInt(id, 10)

    if (isNaN(productId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid product ID',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Find product by ID using findPaginated and filter
    const result = await repository.findPaginated({ page: 1, limit: 1000 })
    const product = result.docs.find((p) => p.id === productId)

    if (!product) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Product not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if product is published
    if (product.statusName !== 'PUBLISHED') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Product not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse dataIn
    let dataIn = null
    if (product.dataIn) {
      try {
        dataIn = typeof product.dataIn === 'string' ? parseJson(product.dataIn, null) : product.dataIn
      } catch {
        dataIn = null
      }
    }

    // Fetch variants for this product
    // Variants have fullPaid that starts with product.paid
    const { ProductVariantsRepository } = await import('@/shared/repositories/product-variants.repository')
    const variantsRepo = ProductVariantsRepository.getInstance(env.DB)
    
    // Get all variants and filter by product paid
    const allVariants = await variantsRepo.findPaginated({ page: 1, limit: 1000 })
    const productVariants = allVariants.docs.filter(v => 
      v.fullPaid && v.fullPaid.startsWith(`${product.paid}-`)
    )

    // Parse variants dataIn
    const parsedVariants = productVariants.map((variant) => {
      let variantDataIn = null
      if (variant.dataIn) {
        try {
          variantDataIn = typeof variant.dataIn === 'string' ? parseJson(variant.dataIn, null) : variant.dataIn
        } catch {
          variantDataIn = null
        }
      }

      return {
        id: variant.id,
        uuid: variant.uuid,
        title: variant.title,
        sku: variant.sku,
        data_in: variantDataIn,
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: product.id,
          uuid: product.uuid,
          title: product.title,
          category: product.category,
          type: product.type,
          dataIn: dataIn,
          variants: parsedVariants,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Get product error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch product',
        details: String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

