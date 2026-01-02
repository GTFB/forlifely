/// <reference types="@cloudflare/workers-types" />

import { Env } from "@/shared/types"
import { COLLECTION_GROUPS } from "@/shared/collections"
import { getCollection } from "@/shared/collections/getCollection"
import qs from "qs"
import { sql } from "drizzle-orm"
import { withAdminGuard, AuthenticatedRequestContext } from '@/shared/api-guard'
import { getPostgresClient, executeRawQuery, createDb } from '@/shared/repositories/utils'

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
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  ordinal_position: number
  [key: string]: unknown
}

const DEFAULT_STATE: AdminState = {
  collection: "users",
  page: 1,
  pageSize: 10,
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

export const onRequestGet = async (context: AuthenticatedRequestContext) => {
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
    const db = createDb()
    const client = getPostgresClient(db)
    
    // Get table schema
    const schemaResult = await executeRawQuery<ColumnInfo>(
      client,
      `SELECT column_name, data_type, is_nullable, column_default, ordinal_position
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [state.collection]
    )

    if (!schemaResult || schemaResult.length === 0) {
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
    
    const columns = schemaResult.map((col: ColumnInfo) => ({
      name: col.column_name,
      type: col.data_type.toUpperCase(),
      nullable: col.is_nullable === 'YES',
      primary: false, // Will be determined separately if needed
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

    const hasDeletedAt = schemaResult.some((c: ColumnInfo) => c.column_name.toLowerCase() === 'deleted_at')
    
    // Build WHERE clause
    const whereParts: string[] = []
    const bindings: any[] = []
    
    if (hasDeletedAt) {
      whereParts.push(`${q('deleted_at')} IS NULL`)
    }
    
    // Apply column filters from state.filters (only real DB columns are supported)
    if (Array.isArray(state.filters) && state.filters.length > 0) {
      const allowedOps = new Set(["eq", "neq", "gt", "gte", "lt", "lte", "like", "in"])
      const realColumnNames = new Set(columns.map((c: { name: string }) => c.name))

      for (const f of state.filters) {
        if (!f || typeof f.field !== "string" || !allowedOps.has(f.op)) continue
        if (!realColumnNames.has(f.field)) continue // skip virtual/non-existent fields

        const colExpr = q(f.field)

        switch (f.op) {
          case "eq":
            whereParts.push(`${colExpr} = $${bindings.length + 1}`)
            bindings.push(f.value)
            break
          case "neq":
            whereParts.push(`${colExpr} != $${bindings.length + 1}`)
            bindings.push(f.value)
            break
          case "gt":
            whereParts.push(`${colExpr} > $${bindings.length + 1}`)
            bindings.push(f.value)
            break
          case "gte":
            whereParts.push(`${colExpr} >= $${bindings.length + 1}`)
            bindings.push(f.value)
            break
          case "lt":
            whereParts.push(`${colExpr} < $${bindings.length + 1}`)
            bindings.push(f.value)
            break
          case "lte":
            whereParts.push(`${colExpr} <= $${bindings.length + 1}`)
            bindings.push(f.value)
            break
          case "like": {
            whereParts.push(`${colExpr} LIKE $${bindings.length + 1}`)
            // Default to contains match
            const v = typeof f.value === "string" ? `%${f.value}%` : String(f.value)
            bindings.push(v)
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
            const placeholders = valuesArray.map((_, i) => `$${bindings.length + i + 1}`).join(", ")
            whereParts.push(`${colExpr} IN (${placeholders})`)
            bindings.push(...valuesArray)
            break
          }
        }
      }
    }

    // Add search condition if search is provided
    if (state.search) {
      // Get all TEXT columns for search
      const searchableColumns = columns.filter((col: { type: string }) => col.type === 'TEXT' || col.type === 'INTEGER')
      if (searchableColumns.length > 0) {
        const searchConditions = searchableColumns.map((col: { name: string }, idx: number) => 
          `${q(col.name)} LIKE $${bindings.length + idx + 1}`
        ).join(' OR ')
        whereParts.push(`(${searchConditions})`)
        // Add search pattern for each searchable column
        searchableColumns.forEach(() => {
          bindings.push(`%${state.search}%`)
        })
      }
    }
    
    const where = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${q(state.collection)} ${where}`
    const countResult = await executeRawQuery<{ total: string | number }>(
      client,
      countQuery,
      bindings
    )

    const total = Number(countResult[0]?.total) || 0

    // Get data with pagination
    const offset = (state.page - 1) * state.pageSize
    const dataQuery = `SELECT * FROM ${q(state.collection)} ${where} LIMIT $${bindings.length + 1} OFFSET $${bindings.length + 2}`
    const dataResult = await executeRawQuery(
      client,
      dataQuery,
      [...bindings, state.pageSize, offset]
    )

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
                processed[col.name] = JSON.parse(value)
              }
            } catch {
              // Not valid JSON, keep as is
              console.warn(`Failed to parse JSON field ${col.name} for collection ${state.collection}`)
            }
          } else if (col.type === 'TEXT' && processed[col.name]) {
            // Fallback: try parsing TEXT fields that look like JSON (for backward compatibility)
            try {
              const value = processed[col.name]
              if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                processed[col.name] = JSON.parse(value)
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
              processed[vField.name] = await fieldConfig.options.value(processed)
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

export const onRequestOptions = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  })

export const GET = withAdminGuard(onRequestGet)

export async function OPTIONS() {
  return onRequestOptions()
}
