/// <reference types="@cloudflare/workers-types" />

import { getSession } from '@/shared/session'
import { Env } from '@/shared/types'
import { MeRepository } from '@/shared/repositories/me.repository'
import { db } from '@/shared/db'
import { schema } from '@/shared/schema/schema'
import { eq, and, desc, isNull, sql } from 'drizzle-orm'

/**
 * GET /api/c/dashboard
 * Returns dashboard statistics for consumer
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
    
    // Get active deals count
    const activeDeals = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.clientAid, human.haid),
          isNull(schema.deals.deletedAt),
          eq(schema.deals.statusName, 'Активна')
        )
      )

    // Get total debt (sum from active deals)
    const totalDebtResult = await db
      .select({ total: sql<number>`sum(cast(json_extract(${schema.deals.dataIn}, '$.totalAmount') as real))` })
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.clientAid, human.haid),
          isNull(schema.deals.deletedAt),
          eq(schema.deals.statusName, 'Активна')
        )
      )

    // Get next payment (from active deals, find minimum payment date)
    const nextPaymentResult = await db
      .select({
        amount: sql<string>`json_extract(${schema.deals.dataIn}, '$.nextPaymentAmount')`,
        date: sql<string>`json_extract(${schema.deals.dataIn}, '$.nextPaymentDate')`,
      })
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.clientAid, human.haid),
          isNull(schema.deals.deletedAt),
          eq(schema.deals.statusName, 'Активна')
        )
      )
      .orderBy(sql`json_extract(${schema.deals.dataIn}, '$.nextPaymentDate')`)
      .limit(1)

    // Get recent deals (last 5)
    const recentDeals = await db
      .select()
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.clientAid, human.haid),
          isNull(schema.deals.deletedAt)
        )
      )
      .orderBy(desc(schema.deals.createdAt))
      .limit(5)

    const stats = {
      activeDealsCount: activeDeals[0]?.count || 0,
      totalDebt: totalDebtResult[0]?.total || 0,
      nextPayment: nextPaymentResult[0] ? {
        amount: parseFloat(nextPaymentResult[0].amount || '0'),
        date: nextPaymentResult[0].date,
      } : null,
      recentDeals: recentDeals.map(deal => ({
        id: deal.daid,
        uuid: deal.uuid,
        title: deal.title || 'Без названия',
        status: deal.statusName,
        createdAt: deal.createdAt,
        dataIn: deal.dataIn ? deal.dataIn : null,
      })),
    }

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to load dashboard data', details: String(error) }),
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


