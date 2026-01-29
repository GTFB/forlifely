/// <reference types="@cloudflare/workers-types" />

import { buildRequestEnv } from '@/shared/env'
import { schema } from '@/shared/schema/schema'
import { count } from 'drizzle-orm'

/**
 * GET /api/auth/check-users
 * Checks if any users exist in the database
 */
export async function GET(request: Request) {
  const env = buildRequestEnv()

  try {
    const [result] = await env.DB.select({ count: count() }).from(schema.users)

    const hasUsers = (result?.count || 0) > 0

    return new Response(
      JSON.stringify({ hasUsers, count: result?.count || 0 }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Check users error:', error)
    return new Response(
      JSON.stringify({ error: 'Database error', details: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
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


