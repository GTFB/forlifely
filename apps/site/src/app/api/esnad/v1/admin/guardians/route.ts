import { NextRequest } from 'next/server'
import { withAdminGuard, AuthenticatedRequestContext } from '@/shared/api-guard'
import { createDb } from '@/shared/repositories/utils'
import { schema } from '@/shared/schema'
import { and, desc, isNull, sql } from 'drizzle-orm'

const jsonHeaders = {
  'Content-Type': 'application/json',
} as const

interface Guardian {
  uuid: string
  haid: string
  fullName: string
  type?: string | null
  createdAt?: string
  dataIn?: any
}

const handleGet = async (context: AuthenticatedRequestContext) => {
  const { request } = context
  try {
    const url = new URL(request.url)
    const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 20), 100))
    const page = Math.max(1, Number(url.searchParams.get('page') || 1))
    const offset = (page - 1) * limit

    const db = createDb()

    // Get all humans that are guarantors
    // Filter by: type = 'GUARANTOR' OR data_in->>'guarantor' = 'true' OR data_in->>'guarantorAid' IS NOT NULL
    const guardians = await db
      .select()
      .from(schema.humans)
      .where(
        and(
          isNull(schema.humans.deletedAt),
          sql`(
            ${schema.humans.type} = 'GUARANTOR' OR
            (${schema.humans.dataIn}::jsonb->>'guarantor') = 'true' OR
            (${schema.humans.dataIn}::jsonb->>'guarantorAid') IS NOT NULL
          )`
        )
      )
      .orderBy(desc(schema.humans.createdAt))
      .limit(limit)
      .offset(offset)
      .execute() as Guardian[]

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.humans)
      .where(
        and(
          isNull(schema.humans.deletedAt),
          sql`(
            ${schema.humans.type} = 'GUARANTOR' OR
            (${schema.humans.dataIn}::jsonb->>'guarantor') = 'true' OR
            (${schema.humans.dataIn}::jsonb->>'guarantorAid') IS NOT NULL
          )`
        )
      )
      .execute()

    const total = Number(countResult?.count) || 0
    const totalPages = Math.max(1, Math.ceil(total / limit))

    // Process dataIn fields
    const processedGuardians = guardians.map((guardian) => {
      const processed: any = { ...guardian }
      
      // Parse dataIn if it's a string
      if (processed.dataIn && typeof processed.dataIn === 'string') {
        try {
          processed.dataIn = JSON.parse(processed.dataIn)
        } catch {
          processed.dataIn = {}
        }
      }
      
      return processed
    })

    return new Response(
      JSON.stringify({
        docs: processedGuardians,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      }),
      {
        status: 200,
        headers: jsonHeaders,
      }
    )
  } catch (error) {
    console.error('Get guardians error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch guardians',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<Record<string, never>> }
) {
  return withAdminGuard(async (ctx: AuthenticatedRequestContext) => {
    return handleGet(ctx)
  })(request, context)
}

