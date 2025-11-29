
import { DealsRepository } from '@/shared/repositories/deals.repository'
import type { DbFilters } from '@/shared/types/shared'
import { withClientGuard, AuthenticatedRequestContext } from '@/shared/api-guard'
import { processDataClientDeal } from '../route'
import { LoanApplication } from '@/shared/types/esnad'

/**
 * GET /api/c/deals/[id]
 * Returns deal details by ID
 */
export const onRequestGet = async (context: AuthenticatedRequestContext) => {
  const { request, env, params } = context
  const id = params?.id

  if (!id) {
    return new Response(JSON.stringify({ error: 'Deal ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { human } = context.user
    
    if (!human?.haid) {
      return new Response(JSON.stringify({ error: 'Human profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    const dealsRepository = DealsRepository.getInstance()
    
    // Build filters for deal search
    const filters: DbFilters = {
      conditions: [
        {
          field: 'daid',
          operator: 'eq',
          values: [id],
        },
        {
          field: 'clientAid',
          operator: 'eq',
          values: [human.haid],
        },
        {
          field: 'dataIn',
          operator: 'like',
          values: ['%"type":"LOAN_APPLICATION"%'],
        },
      ],
    }
    
    // Get deal using repository
    const result = await dealsRepository.getDeals({
      filters,
      pagination: { page: 1, limit: 1 },
    })

    const deal = result.docs[0]

    if (!deal) {
      return new Response(JSON.stringify({ error: 'Deal not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        deal: await processDataClientDeal(deal as LoanApplication),
        
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Get deal error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get deal', details: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export const onRequestOptions = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })

export const GET = withClientGuard(onRequestGet)  

export async function OPTIONS() {
  return onRequestOptions()
}

