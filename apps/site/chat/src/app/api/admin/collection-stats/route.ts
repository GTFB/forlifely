/// <reference types="@cloudflare/workers-types" />

import { AuthenticatedContext, CollectionStats } from '@/shared/types'
import { withAdminGuard } from '@/shared/api-guard'
import { sql } from 'drizzle-orm'

/**
 * GET /api/admin/collection-stats?name=users
 * Returns statistics for a specific collection
 */
async function handleGet(context: AuthenticatedContext): Promise<Response> {
  const { request, env } = context

  try {
    const url = new URL(request.url)
    const collectionName = url.searchParams.get('name')

    if (!collectionName) {
      return new Response(
        JSON.stringify({ error: 'Collection name is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate table exists using PostgreSQL information_schema
    const tablesResult = await env.DB.execute(
      sql`SELECT table_name as name FROM information_schema.tables WHERE table_name = ${collectionName}`
    );

    if (tablesResult.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Collection not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get total count
    const totalResult = await env.DB.execute(sql.raw(`SELECT COUNT(*) as count FROM "${collectionName}"`));
    const total = Number(totalResult[0]?.count || 0);

    // Check if table has deleted_at column using information_schema
    const columnsResult = await env.DB.execute(
       sql`SELECT column_name as name, data_type as type FROM information_schema.columns WHERE table_name = ${collectionName}`
    ) as unknown as { name: string; type: string }[];

    const columns = columnsResult;
    const hasDeletedAt = columns.some((col) => col.name === 'deleted_at')
    const hasUuid = columns.some((col) => col.name === 'uuid')

    let activeCount = total
    let deletedCount = 0

    if (hasDeletedAt) {
      const activeResult = await env.DB.execute(
        sql.raw(`SELECT COUNT(*) as count FROM "${collectionName}" WHERE deleted_at IS NULL`)
      );

      activeCount = Number(activeResult[0]?.count || 0);
      deletedCount = total - activeCount
    }

    const stats: CollectionStats = {
      name: collectionName,
      count: activeCount,
      hasDeleted: hasDeletedAt,
      hasUuid,
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        total,
        active: activeCount,
        deleted: deletedCount,
        columns: columns.length || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Get collection stats error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch collection stats', 
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
