/// <reference types="@cloudflare/workers-types" />

import { getSession } from '@/shared/session'
import { Env } from '@/shared/types'
import { MeRepository } from '@/shared/repositories/me.repository'
import { db } from '@/shared/db'
import { schema } from '@/shared/schema/schema'
import { eq, and, isNull, desc, sql, or, like } from 'drizzle-orm'
import { buildRequestEnv } from '@/shared/env'

/**
 * GET /api/c/deals
 * Returns list of deals for consumer
 */
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context

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
    const meRepository = MeRepository.getInstance()
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

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    
    // Build where conditions
    const conditions = [
      eq(schema.deals.clientAid, human.haid),
      isNull(schema.deals.deletedAt),
    ]

    if (status) {
      conditions.push(eq(schema.deals.statusName, status))
    }

    if (search) {
      conditions.push(
        or(
          like(schema.deals.title, `%${search}%`),
          like(schema.deals.daid, `%${search}%`)
        )!
      )
    }

    // Get deals
    const deals = await db
      .select()
      .from(schema.deals)
      .where(and(...conditions))
      .orderBy(desc(schema.deals.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.deals)
      .where(and(...conditions))

    const total = totalResult[0]?.count || 0

    return new Response(
      JSON.stringify({
        deals: deals.map(deal => ({
          id: deal.daid,
          uuid: deal.uuid,
          title: deal.title || 'Без названия',
          status: deal.statusName,
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt,
          dataIn: deal.dataIn ? deal.dataIn : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Get deals error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get deals', details: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * POST /api/c/deals
 * Create new deal application
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context

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
    const body = await request.json()
    
    // TODO: Validate body with Zod schema
    // TODO: Create deal application in database
    // For now, return success
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Deal application created',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Create deal error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create deal', details: String(error) }),
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })

export async function GET(request: Request) {
  const env = buildRequestEnv()
  return onRequestGet({ request, env })
}

export async function POST(request: Request) {
  const env = buildRequestEnv()
  return onRequestPost({ request, env })
}

export async function OPTIONS() {
  return onRequestOptions()
}
