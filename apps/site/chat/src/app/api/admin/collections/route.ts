/// <reference types="@cloudflare/workers-types" />

import { withAdminGuard, withEditorGuard } from '@/shared/api-guard'
import { COLLECTION_GROUPS } from '@/shared/collections'
import { AuthenticatedContext, CollectionGroup, TableInfo } from '@/shared/types'
import { sql } from 'drizzle-orm'

/**
 * GET /api/admin/collections
 * Returns list of all collections grouped by category
 */
async function handleGet(context: AuthenticatedContext): Promise<Response> {
  const { env } = context

  try {
    // Get all tables from database (PostgreSQL information_schema)
    const tablesResult = await env.DB.execute(
      sql`SELECT table_name as name, table_type as type 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name`
    );

    const tables = tablesResult as unknown as TableInfo[];

    // Group collections
    const grouped: CollectionGroup[] = []
    const tableNames = new Set(tables.map((t) => t.name))

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
        total: tables.length,
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

// Allow both Admin and Editor roles to access collections list
export const GET = withEditorGuard(handleGet)

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}
