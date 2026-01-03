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

  const userId = Number(context.user.id)
  const db = createDb()

  const rows = await db
    .select()
    .from(schema.journals)
    .where(sql`${schema.journals.user_id} = ${userId}`)
    .orderBy(sql`${schema.journals.createdAt} desc nulls last`)
    .limit(pageSize)
    .offset(offset)
    .execute()

  const totalRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.journals)
    .where(sql`${schema.journals.user_id} = ${userId}`)
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


