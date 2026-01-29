/// <reference types="@cloudflare/workers-types" />

import { withAdminGuard, withEditorGuard } from '@/shared/api-guard'
import { COLLECTION_GROUPS } from '@/shared/collections'
import { getCollection } from '@/shared/collections/getCollection'
import { AuthenticatedContext, Env } from '@/shared/types'
import qs from 'qs'
import { sql } from 'drizzle-orm'

interface AdminFilter {
  field: string
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "in"
  value: unknown
}

interface AdminState {
  collection: string
  page: number
  pageSize: number
  filters: AdminFilter[]
  search: string
}

interface ColumnInfo {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: string | null
  pk: number
}

const DEFAULT_STATE: AdminState = {
  collection: "users",
  page: 1,
  pageSize: 20,
  filters: [],
  search: "",
}

function q(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"'
}

// Check if collection exists in COLLECTION_GROUPS
function isValidCollection(name: string): boolean {
  const all = Object.values(COLLECTION_GROUPS).flat()
  return all.includes(name)
}

function parseStateFromUrl(url: URL): AdminState {
  // Parse query string with qs
  const parsed = qs.parse(url.search.slice(1))
  
  const collection = (parsed.c as string) || DEFAULT_STATE.collection
  const page = Math.max(1, Number(parsed.p) || DEFAULT_STATE.page)
  const pageSize = Math.max(1, Number(parsed.ps) || DEFAULT_STATE.pageSize)
  const search = (parsed.s as string) || DEFAULT_STATE.search
  
  let filters: AdminFilter[] = []
  if (parsed.filters && Array.isArray(parsed.filters)) {
    filters = parsed.filters.filter((item: any) => item && typeof item.field === "string") as unknown as AdminFilter[]
  }
  
  return { collection, page, pageSize, filters, search }
}

async function handleGet(context: AuthenticatedContext) {
  const { request, env } = context
  const url = new URL(request.url)

  const state = parseStateFromUrl(url)

  // Validate collection
  if (!isValidCollection(state.collection)) {
    return new Response(
      JSON.stringify({ error: "Invalid collection", state }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  try {
    // Get table schema using PostgreSQL information_schema
    const columnsResult = await env.DB.execute(
       sql`SELECT column_name as name, data_type as type, is_nullable as nullable 
           FROM information_schema.columns 
           WHERE table_name = ${state.collection}`
    ) as unknown as { name: string; type: string; nullable: string }[];

    // Get PK info
    const pkResult = await env.DB.execute(
      sql`
        SELECT a.attname as name
        FROM   pg_index i
        JOIN   pg_attribute a ON a.attrelid = i.indrelid
                             AND a.attnum = ANY(i.indkey)
        WHERE  i.indrelid = ${state.collection}::regclass
        AND    i.indisprimary
      `
    );
    const pk = (pkResult[0]?.name as string) || 'id';

    if (!columnsResult || columnsResult.length === 0) {
      return new Response(
        JSON.stringify({ error: "Collection not found or has no columns", state }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Get collection config for virtual fields
    const collectionConfig = getCollection(state.collection)
    
    const columns = columnsResult.map((col) => ({
      name: col.name,
      type: col.type,
      nullable: col.nullable === 'YES',
      primary: col.name === pk,
    }))
    
    // Add virtual fields to schema
    const virtualFields: any[] = []
    for (const key in collectionConfig) {
      const fieldConfig = (collectionConfig as any)[key]
      if (fieldConfig?.options?.virtual && fieldConfig?.options?.value) {
        virtualFields.push({
          name: key,
          type: fieldConfig.options.type || 'TEXT',
          nullable: !fieldConfig.options.required,
          primary: false,
          virtual: true,
        })
      }
    }
    
    // Merge real and virtual columns
    const allColumns = [...columns, ...virtualFields]

    const hasDeletedAt = columnsResult.some((c) => c.name.toLowerCase() === 'deleted_at')
    
    // Build WHERE clause
    const whereParts: string[] = []
    const bindings: any[] = []
    
    if (hasDeletedAt) {
      whereParts.push(`${q('deleted_at')} IS NULL`)
    }
    
    // Apply column filters from state.filters (only real DB columns are supported)
    if (Array.isArray(state.filters) && state.filters.length > 0) {
      const allowedOps = new Set(["eq", "neq", "gt", "gte", "lt", "lte", "like", "in"])
      const realColumnNames = new Set(columns.map((c) => c.name))

      for (const f of state.filters) {
        if (!f || typeof f.field !== "string" || !allowedOps.has(f.op)) continue
        if (!realColumnNames.has(f.field)) continue // skip virtual/non-existent fields

        const colExpr = q(f.field)

        switch (f.op) {
          case "eq":
            whereParts.push(`${colExpr} = '${String(f.value).replace(/'/g, "''")}'`) // Simple escaping for now
            break
          case "neq":
             whereParts.push(`${colExpr} != '${String(f.value).replace(/'/g, "''")}'`)
            break
          case "gt":
             whereParts.push(`${colExpr} > '${String(f.value).replace(/'/g, "''")}'`)
            break
          case "gte":
            whereParts.push(`${colExpr} >= '${String(f.value).replace(/'/g, "''")}'`)
            break
          case "lt":
             whereParts.push(`${colExpr} < '${String(f.value).replace(/'/g, "''")}'`)
            break
          case "lte":
            whereParts.push(`${colExpr} <= '${String(f.value).replace(/'/g, "''")}'`)
            break
          case "like": {
             // Default to contains match
            const v = typeof f.value === "string" ? `%${f.value}%` : String(f.value)
            whereParts.push(`${colExpr} LIKE '${v.replace(/'/g, "''")}'`)
            break
          }
          case "in": {
            // Support array or comma-separated string
            const valuesArray = Array.isArray(f.value)
              ? (f.value as any[])
              : typeof f.value === "string"
                ? (f.value as string).split(",").map((s) => s.trim()).filter((s) => s.length > 0)
                : []
            if (valuesArray.length === 0) {
              // No values -> force false condition to avoid SQL error
              whereParts.push("1 = 0")
              break
            }
             const placeholders = valuesArray.map(v => `'${String(v).replace(/'/g, "''")}'`).join(", ")
            whereParts.push(`${colExpr} IN (${placeholders})`)
            break
          }
        }
      }
    }

    // Add search condition if search is provided
    if (state.search) {
      // Get all TEXT columns for search
      const searchableColumns = columns.filter(col => col.type === 'text' || col.type === 'character varying' || col.type === 'integer') // PostgreSQL types
      if (searchableColumns.length > 0) {
        const searchConditions = searchableColumns.map(col => 
           col.type === 'integer' 
            ? `CAST(${q(col.name)} AS TEXT) LIKE '%${state.search.replace(/'/g, "''")}%'`
            : `${q(col.name)} LIKE '%${state.search.replace(/'/g, "''")}%'`
        ).join(' OR ')
        whereParts.push(`(${searchConditions})`)
      }
    }
    
    const where = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

    // Get total count
    const countResult = await env.DB.execute(sql.raw(`SELECT COUNT(*) as total FROM "${state.collection}" ${where}`));
    const total = Number(countResult[0]?.total || 0);

    // Get data with pagination
    const offset = (state.page - 1) * state.pageSize
    const dataResult = await env.DB.execute(
       sql.raw(`SELECT * FROM "${state.collection}" ${where} ORDER BY "id" DESC LIMIT ${state.pageSize} OFFSET ${offset}  `)
    );

    // Process data: parse JSON fields and compute virtual fields
    const processedData = await Promise.all(
      (dataResult || []).map(async (row: any) => {
        const processed = { ...row }
        
        // Parse JSON fields based on collection config
        for (const col of columns) {
          const fieldConfig = (collectionConfig as any)[col.name]
          const isJsonField = fieldConfig?.options?.type === 'json'
          
          if (isJsonField && processed[col.name] != null) {
            try {
              const value = processed[col.name]
              if (typeof value === 'string') {
                let parsed = JSON.parse(value)
                // Handle double-encoded JSON strings (when JSON is stored as escaped string)
                if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('['))) {
                  try {
                    parsed = JSON.parse(parsed)
                  } catch {
                    // If second parse fails, use first parse result
                  }
                }
                processed[col.name] = parsed
              }
            } catch {
              // Not valid JSON, keep as is
              console.warn(`Failed to parse JSON field ${col.name} for collection ${state.collection}`)
            }
          } else if ((col.type === 'text' || col.type === 'character varying') && processed[col.name]) {
            // Fallback: try parsing TEXT fields that look like JSON (for backward compatibility)
            try {
              const value = processed[col.name]
              if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('[') || value.startsWith('"'))) {
                let parsed = JSON.parse(value)
                // Handle double-encoded JSON strings (when JSON is stored as escaped string)
                if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('['))) {
                  try {
                    parsed = JSON.parse(parsed)
                  } catch {
                    // If second parse fails, use first parse result
                  }
                }
                processed[col.name] = parsed
              }
            } catch {
              // Not JSON, keep as is
            }
          }
        }
        
        // Compute virtual fields
        for (const vField of virtualFields) {
          const fieldConfig = (collectionConfig as any)[vField.name]
          if (fieldConfig?.options?.value) {
            try {
              // Pass context (env) to value function for database access
              processed[vField.name] = await fieldConfig.options.value(processed, { env })
            } catch (error) {
              console.error(`Error computing virtual field ${vField.name}:`, error)
              processed[vField.name] = null
            }
          }
        }
        
        // Remove password fields from response
        for (const key in collectionConfig) {
          const fieldConfig = (collectionConfig as any)[key]
          if (fieldConfig?.options?.type === 'password') {
            delete processed[key]
          }
        }
        
        return processed
      })
    )

    return new Response(
      JSON.stringify({
        success: true,
        state,
        schema: {
          columns: allColumns,
          total,
          totalPages: Math.ceil(total / state.pageSize),
        },
        data: processedData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("State API error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to fetch collection data",
        details: String(error),
        state,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

// Allow both Admin and Editor roles for state endpoint
export const GET = withEditorGuard(handleGet)

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  })
}
