import { NextRequest, NextResponse } from "next/server"
import { withAdminGuard, type AuthenticatedRequestContext } from "@/shared/api-guard"
import { createDb, getPostgresClient } from "@/shared/repositories/utils"
import postgres from "postgres"

const handlePost = async (
  context: AuthenticatedRequestContext,
  request: NextRequest
): Promise<Response> => {
  try {
    const body = await request.json()
    const { query, params = [] } = body as { query: string; params?: any[] }

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Query is required",
        },
        { status: 400 }
      )
    }

    // Trim and validate query
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      return NextResponse.json(
        {
          success: false,
          error: "Query cannot be empty",
        },
        { status: 400 }
      )
    }

    // Security: Only allow SELECT, INSERT, UPDATE, DELETE queries
    // Block dangerous operations like DROP, TRUNCATE, ALTER, etc.
    const upperQuery = trimmedQuery.toUpperCase()
    const dangerousKeywords = [
      "DROP",
      "TRUNCATE",
      "ALTER",
      "CREATE",
      "GRANT",
      "REVOKE",
      "EXEC",
      "EXECUTE",
    ]

    // Allow SELECT, INSERT, UPDATE, DELETE
    const allowedKeywords = ["SELECT", "INSERT", "UPDATE", "DELETE", "WITH"]
    const startsWithAllowed = allowedKeywords.some((keyword) =>
      upperQuery.startsWith(keyword)
    )

    if (!startsWithAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Only SELECT, INSERT, UPDATE, DELETE queries are allowed",
        },
        { status: 400 }
      )
    }

    // Check for dangerous keywords
    const hasDangerousKeyword = dangerousKeywords.some((keyword) =>
      upperQuery.includes(keyword)
    )

    if (hasDangerousKeyword) {
      return NextResponse.json(
        {
          success: false,
          error: "Query contains dangerous operations that are not allowed",
        },
        { status: 400 }
      )
    }

    const db = createDb()
    const client = getPostgresClient(db)

    try {
      // Execute query
      let result: any[]
      let rowCount = 0

      if (client instanceof postgres.Sql) {
        // postgres-js
        if (params && params.length > 0) {
          result = await client.unsafe(trimmedQuery, params)
        } else {
          result = await client.unsafe(trimmedQuery)
        }
        rowCount = Array.isArray(result) ? result.length : 0
      } else {
        // node-postgres (Pool)
        const pool = client as any
        const queryResult = await pool.query(trimmedQuery, params || [])
        result = queryResult.rows || []
        rowCount = queryResult.rowCount || 0
      }

      return NextResponse.json(
        {
          success: true,
          data: result,
          rowCount,
          columns: result.length > 0 ? Object.keys(result[0]) : [],
        },
        { status: 200 }
      )
    } catch (error: any) {
      console.error("SQL execution error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to execute query",
          details: error.detail || null,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Failed to execute SQL query:", error)
    const message = error instanceof Error ? error.message : "Failed to execute SQL query"
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<Record<string, never>> }
) {
  return withAdminGuard(async (ctx: AuthenticatedRequestContext) => {
    return handlePost(ctx, request)
  })(request, context)
}






