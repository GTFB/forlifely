import { NextRequest, NextResponse } from "next/server"
import { withAdminGuard, type AuthenticatedRequestContext } from "@/shared/api-guard"
import { schema } from "@/shared/schema"
import { sql } from "drizzle-orm"
import { createDb } from "@/shared/repositories/utils"

export const GET = withAdminGuard(async (context: AuthenticatedRequestContext): Promise<Response> => {
  const { request } = context
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get("p") || "1"))
  const pageSize = Math.max(1, Math.min(50, Number(url.searchParams.get("ps") || "10")))
  const offset = (page - 1) * pageSize

  // Filter parameters
  const actionFilter = url.searchParams.get("action")
  const dateFrom = url.searchParams.get("dateFrom")
  const dateTo = url.searchParams.get("dateTo")
  const pageFilter = url.searchParams.get("page")

  const userId = Number(context.user.id)
  const db = createDb()

  // Build WHERE conditions
  const conditions: any[] = [sql`${schema.journals.user_id} = ${userId}`]
  
  if (actionFilter) {
    conditions.push(sql`${schema.journals.action} = ${actionFilter}`)
  }
  
  if (dateFrom) {
    // Convert dateFrom (YYYY-MM-DD) to TIMESTAMP for PostgreSQL comparison
    // createdAt is stored as TIMESTAMP in PostgreSQL, but schema defines it as text
    const dateFromISO = `${dateFrom}T00:00:00.000Z`
    conditions.push(sql`${schema.journals.createdAt} >= ${dateFromISO}::TIMESTAMP`)
  }
  
  if (dateTo) {
    // Add 23:59:59 to include the entire end date
    const dateToISO = `${dateTo}T23:59:59.999Z`
    conditions.push(sql`${schema.journals.createdAt} <= ${dateToISO}::TIMESTAMP`)
  }
  
  if (pageFilter) {
    // Search in details JSON for url or pathname
    // Structure: details.payload.url and details.payload.pathname
    const searchPattern = `%${pageFilter}%`
    conditions.push(
      sql`(
        ${schema.journals.details}::text ILIKE ${searchPattern} OR
        (${schema.journals.details}->'payload'->>'url') ILIKE ${searchPattern} OR
        (${schema.journals.details}->'payload'->>'pathname') ILIKE ${searchPattern}
      )`
    )
  }

  const whereClause = conditions.length > 1 
    ? conditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)
    : conditions[0]

  const rows = await db
    .select()
    .from(schema.journals)
    .where(whereClause)
    .orderBy(sql`${schema.journals.id} desc`)
    .limit(pageSize)
    .offset(offset)
    .execute()

  const totalRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.journals)
    .where(whereClause)
    .execute()

  const total = Number((totalRows?.[0] as any)?.count || 0)

  return NextResponse.json(
    {
      success: true,
      docs: rows,
      pagination: {
        total,
        page,
        limit: pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    },
    { status: 200 },
  )
})


