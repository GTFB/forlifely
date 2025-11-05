/// <reference types="@cloudflare/workers-types" />

import { getSession } from '../../../_shared/session'
import { Env } from '../../../_shared/types'
import { MeRepository } from '../../../_shared/repositories/me.repository'
import { createDb } from '../../../_shared/repositories/utils'
import { schema } from '../../../_shared/schema/schema'
import { eq, and, isNull } from 'drizzle-orm'

/**
 * GET /api/c/deals/[id]
 * Returns deal details by ID
 */
export const onRequestGet = async (
  context: { request: Request; env: Env; params: Promise<{ id: string }> }
) => {
  const { request, env, params } = context
  const { id } = await params

  if (!env.AUTH_SECRET) {
    return new Response(JSON.stringify({ error: 'Authentication not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sessionUser = await getSession(request, env.AUTH_SECRET)

  if (!sessionUser) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const meRepository = MeRepository.getInstance(env.DB)
    const userWithRoles = await meRepository.findByIdWithRoles(Number(sessionUser.id))

    if (!userWithRoles) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { human } = userWithRoles
    
    if (!human?.haid) {
      return new Response(JSON.stringify({ error: 'Human profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const db = createDb(env.DB)
    
    // Get deal by ID
    const [deal] = await db
      .select()
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.daid, id),
          eq(schema.deals.clientAid, human.haid),
          isNull(schema.deals.deletedAt)
        )
      )
      .limit(1)

    if (!deal) {
      return new Response(JSON.stringify({ error: 'Deal not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get deal products if needed
    const products = await db
      .select()
      .from(schema.dealProducts)
      .where(eq(schema.dealProducts.fullDaid, deal.fullDaid || ''))

    return new Response(
      JSON.stringify({
        deal: {
          id: deal.daid,
          uuid: deal.uuid,
          title: deal.title || 'Без названия',
          status: deal.statusName,
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt,
          dataIn: deal.dataIn ? JSON.parse(deal.dataIn) : null,
          dataOut: deal.dataOut ? JSON.parse(deal.dataOut) : null,
          products: products.map(product => ({
            id: product.uuid,
            quantity: product.quantity,
            status: product.statusName,
            dataIn: product.dataIn ? JSON.parse(product.dataIn) : null,
          })),
        },
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


