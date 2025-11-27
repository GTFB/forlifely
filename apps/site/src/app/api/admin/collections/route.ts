/// <reference types="@cloudflare/workers-types" />

import { withAdminGuard } from '@/shared/api-guard'
import { AuthenticatedContext } from '@/shared/types'
import { COLLECTION_GROUPS } from '@/shared/collections'
import { buildRequestEnv } from '@/shared/env'
import { getPostgresClient, executeRawQuery } from '@/shared/repositories/utils'

interface TableInfo {
  table_name: string
  table_type: string
}

interface CollectionGroup {
  category: string
  collections: string[]
}

/**
 * GET /api/admin/collections
 * Returns list of all collections grouped by category
 */
async function handleGet(context: AuthenticatedContext): Promise<Response> {
  const { env } = context

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database connection not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const client = getPostgresClient(env.DB)
    
    // Get all tables from database
    const tablesResult = await executeRawQuery<TableInfo>(
      client,
      `SELECT table_name, table_type 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_type = 'BASE TABLE'
       AND table_name NOT LIKE 'sqlite_%' 
       AND table_name NOT LIKE 'd1_%'
       AND table_name NOT LIKE '_migrations'
       ORDER BY table_name`
    )

    if (!tablesResult) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tables' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Group collections
    const grouped: CollectionGroup[] = []
    const tableNames = new Set(tablesResult.map((t: TableInfo) => t.table_name))

    // Group known collections
    for (const [category, collections] of Object.entries(COLLECTION_GROUPS)) {
      const found = collections.filter((name) => tableNames.has(name))
      if (found.length > 0) {
        grouped.push({
          category,
          collections: found,
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: tablesResult.length,
        groups: grouped,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Get collections error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch collections', 
        details: String(error) 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export const GET = withAdminGuard(handleGet)

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

export async function OPTIONS() {
  return onRequestOptions()
}

