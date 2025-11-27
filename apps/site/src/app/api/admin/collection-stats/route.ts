/// <reference types="@cloudflare/workers-types" />

import { withAdminGuard } from '@/shared/api-guard'
import { AuthenticatedContext, CollectionStats } from '@/shared/types'
import { buildRequestEnv } from '@/shared/env'

/**
 * GET /api/admin/collection-stats?name=users
 * Returns statistics for a specific collection
 */
async function handleGet(context: AuthenticatedContext): Promise<Response> {
  const { request, env } = context

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database connection not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

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

    // Validate table exists
    const tableExistsResult = await env.DB.$client.query<{ table_name: string }>(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = $1`,
      [collectionName]
    )

    if (!tableExistsResult.rows || tableExistsResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Collection not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get total count
    const totalResult = await env.DB.$client.query<{ count: string | number }>(
      `SELECT COUNT(*) as count FROM "${collectionName}"`
    )

    const total = Number(totalResult.rows[0]?.count) || 0

    // Check if table has deleted_at column
    const columnsResult = await env.DB.$client.query<{ column_name: string; data_type: string }>(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = $1`,
      [collectionName]
    )

    const hasDeletedAt = columnsResult.rows?.some((col) => col.column_name === 'deleted_at')
    const hasUuid = columnsResult.rows?.some((col) => col.column_name === 'uuid')

    let activeCount = total
    let deletedCount = 0

    if (hasDeletedAt) {
      const activeResult = await env.DB.$client.query<{ count: string | number }>(
        `SELECT COUNT(*) as count FROM "${collectionName}" WHERE deleted_at IS NULL`
      )

      activeCount = Number(activeResult.rows[0]?.count) || 0
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
        columns: columnsResult.rows?.length || 0,
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

