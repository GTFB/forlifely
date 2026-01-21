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
  // Parse query string with qs - use brackets format to match client-side serialization
  const parsed = qs.parse(url.search.slice(1), {
    arrayLimit: 1000,
    parseArrays: true,
    allowDots: false,
    comma: false,
  })
  
  const collection = (parsed.c as string) || DEFAULT_STATE.collection
  const page = Math.max(1, Number(parsed.p) || DEFAULT_STATE.page)
  const pageSize = Math.max(1, Number(parsed.ps) || DEFAULT_STATE.pageSize)
  const search = (parsed.s as string) || DEFAULT_STATE.search
  
  let filters: AdminFilter[] = []
  if (parsed.filters) {
    console.log(`[API /admin/state] Parsing filters from URL:`, {
      rawFilters: parsed.filters,
      isArray: Array.isArray(parsed.filters),
      type: typeof parsed.filters,
      rawUrl: url.search,
    })
    
    // Handle different formats: array, object with numeric keys, or nested object
    if (Array.isArray(parsed.filters)) {
      // Direct array format
      filters = parsed.filters.filter((item: any) => item && typeof item.field === "string") as unknown as AdminFilter[]
    } else if (typeof parsed.filters === 'object' && parsed.filters !== null) {
      // Could be object with numeric keys like {0: {field: 'entity', ...}, 1: {...}}
      // or nested object like {field: ['entity'], op: ['eq'], value: ['contractors.status_name']}
      const filterKeys = Object.keys(parsed.filters)
      
      // Check if it's a nested object format (field, op, value as separate arrays)
      if (filterKeys.includes('field') && filterKeys.includes('op') && filterKeys.includes('value')) {
        const fieldArray = Array.isArray(parsed.filters.field) ? parsed.filters.field : [parsed.filters.field]
        const opArray = Array.isArray(parsed.filters.op) ? parsed.filters.op : [parsed.filters.op]
        const valueArray = Array.isArray(parsed.filters.value) ? parsed.filters.value : [parsed.filters.value]
        
        const maxLength = Math.max(fieldArray.length, opArray.length, valueArray.length)
        filters = []
        for (let i = 0; i < maxLength; i++) {
          if (fieldArray[i] && typeof fieldArray[i] === 'string') {
            filters.push({
              field: fieldArray[i] as string,
              op: opArray[i] as AdminFilter['op'],
              value: valueArray[i],
            })
          }
        }
      } else {
        // Object with numeric keys
        const filterArray = Object.values(parsed.filters)
        filters = filterArray.filter((item: any) => item && typeof item.field === "string") as unknown as AdminFilter[]
      }
    }
    
    console.log(`[API /admin/state] Parsed filters:`, filters)
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
    let schemaResult: ColumnInfo[]
    try {
      schemaResult = await executeRawQuery<ColumnInfo>(
        client,
        `SELECT column_name, data_type, is_nullable, column_default, ordinal_position
         FROM information_schema.columns
         WHERE table_schema = 'public' AND LOWER(table_name) = LOWER($1)
         ORDER BY ordinal_position`,
        [state.collection]
      )
    } catch (schemaError) {
      console.error(`[API /admin/state] Failed to get schema for ${state.collection}:`, schemaError)
      return new Response(
        JSON.stringify({
          error: "Failed to get table schema",
          details: schemaError instanceof Error ? schemaError.message : String(schemaError),
          state,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

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
      dataType: col.data_type.toLowerCase(), // Keep original case for jsonb check
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
      console.log(`[API /admin/state] Processing filters for ${state.collection}:`, {
        filters: state.filters,
        filtersLength: state.filters.length,
        filtersType: typeof state.filters,
        realColumnNames: Array.from(columns.map((c: { name: string }) => c.name)),
      })
      const allowedOps = new Set(["eq", "neq", "gt", "gte", "lt", "lte", "like", "in"])
      const realColumnNames = new Set(columns.map((c: { name: string }) => c.name))

      for (const f of state.filters) {
        console.log(`[API /admin/state] Processing filter:`, {
          filter: f,
          hasField: typeof f?.field === "string",
          field: f?.field,
          op: f?.op,
          value: f?.value,
          isAllowedOp: allowedOps.has(f?.op),
          isRealColumn: realColumnNames.has(f?.field),
          willApply: !!(f && typeof f.field === "string" && allowedOps.has(f.op) && realColumnNames.has(f.field)),
        })
        if (!f || typeof f.field !== "string" || !allowedOps.has(f.op)) {
          console.warn(`[API /admin/state] Skipping invalid filter:`, f)
          continue
        }
        // Handle JSON field filters (e.g., data_in.contractor_caid)
        const isJsonField = f.field.includes('.')
        let colExpr: string
        
        if (isJsonField) {
          const [jsonColumn, jsonKey] = f.field.split('.', 2)
          
          // Find actual column name (handle case variations and snake_case vs camelCase)
          let actualColumnName: string | undefined
          for (const colName of realColumnNames) {
            if (colName.toLowerCase() === jsonColumn.toLowerCase() ||
                colName.replace(/_/g, '').toLowerCase() === jsonColumn.replace(/_/g, '').toLowerCase()) {
              actualColumnName = colName
              break
            }
          }
          
          if (!actualColumnName) {
            console.warn(`[API /admin/state] Skipping filter for non-existent JSON column:`, jsonColumn, `Available columns:`, Array.from(realColumnNames))
            continue
          }
          
          // Find column type to determine if it's jsonb
          const columnInfo = schemaResult.find((c: ColumnInfo) => 
            c.column_name.toLowerCase() === actualColumnName.toLowerCase()
          )
          const dataType = columnInfo?.data_type?.toLowerCase() || ''
          const isJsonb = dataType === 'jsonb' || dataType === 'json'
          
          // Escape single quotes in jsonKey for SQL safety (double single quotes in PostgreSQL)
          const escapedKey = jsonKey.replace(/'/g, "''")
          
          if (isJsonb) {
            // Use JSON path operator for PostgreSQL jsonb
            colExpr = `${q(actualColumnName)}->>'${escapedKey}'`
          } else {
            // For text fields that contain JSON, cast to jsonb first
            // This handles cases where data_in is stored as TEXT but contains JSON
            colExpr = `(${q(actualColumnName)}::jsonb)->>'${escapedKey}'`
          }
        } else {
          if (!realColumnNames.has(f.field)) {
            console.warn(`[API /admin/state] Skipping filter for non-existent column:`, f.field, `Available columns:`, Array.from(realColumnNames))
            continue // skip virtual/non-existent fields
          }
          colExpr = q(f.field)
        }

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

    // Add search condition if search is provided (supports AND/OR operators)
    if (state.search) {
      // Split search by OR (case-sensitive), then by AND inside each group
      const orGroups = state.search
        .split('OR')
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .map((part) =>
          part
            .split('AND')
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
        )
        .filter((group) => group.length > 0)

      // Get all TEXT/INTEGER columns for search
      const searchableColumns = columns.filter((col: { type: string }) => col.type === 'TEXT' || col.type === 'INTEGER')

      if (orGroups.length > 0 && searchableColumns.length > 0) {
        const groupClauses: string[] = []

        for (const group of orGroups) {
          const andClauses: string[] = []

          for (const term of group) {
            const placeholders: string[] = []
            for (const col of searchableColumns) {
              placeholders.push(`${q(col.name)} LIKE $${bindings.length + 1}`)
              bindings.push(`%${term}%`)
            }
            // For this term, match any searchable column
            andClauses.push(`(${placeholders.join(' OR ')})`)
          }

          if (andClauses.length > 0) {
            // All terms in group must match (AND)
            groupClauses.push(`(${andClauses.join(' AND ')})`)
          }
        }

        if (groupClauses.length > 0) {
          // Any group can match (OR)
          whereParts.push(`(${groupClauses.join(' OR ')})`)
        }
      }
    }
    
    const where = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

    console.log(`[API /admin/state] Executing query for ${state.collection}:`, {
      where,
      bindings,
      wherePartsCount: whereParts.length,
    })

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${q(state.collection)} ${where}`
    console.log(`[API /admin/state] Count query:`, countQuery, `Bindings:`, bindings)
    
    let countResult: { total: string | number }[]
    let total = 0
    try {
      countResult = await executeRawQuery<{ total: string | number }>(
        client,
        countQuery,
        bindings
      )
      total = Number(countResult[0]?.total) || 0
      console.log(`[API /admin/state] Total count:`, total)
    } catch (countError) {
      console.error(`[API /admin/state] Count query failed:`, countError)
      console.error(`[API /admin/state] Query was:`, countQuery)
      console.error(`[API /admin/state] Bindings were:`, bindings)
      throw new Error(`Count query failed: ${countError instanceof Error ? countError.message : String(countError)}`)
    }

    // Get data with pagination
    const offset = (state.page - 1) * state.pageSize
    const dataQuery = `SELECT * FROM ${q(state.collection)} ${where} LIMIT $${bindings.length + 1} OFFSET $${bindings.length + 2}`
    console.log(`[API /admin/state] Data query:`, dataQuery, `Bindings:`, [...bindings, state.pageSize, offset])
    
    let dataResult: any[]
    try {
      dataResult = await executeRawQuery(
        client,
        dataQuery,
        [...bindings, state.pageSize, offset]
      )
    } catch (dataError) {
      console.error(`[API /admin/state] Data query failed:`, dataError)
      console.error(`[API /admin/state] Query was:`, dataQuery)
      console.error(`[API /admin/state] Bindings were:`, [...bindings, state.pageSize, offset])
      throw new Error(`Data query failed: ${dataError instanceof Error ? dataError.message : String(dataError)}`)
    }
    
    console.log(`[API /admin/state] Data result length:`, dataResult?.length || 0)

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
    console.error("[API /admin/state] Error:", error)
    
    // Extract meaningful error message
    let errorMessage = "Failed to fetch collection data"
    let errorDetails: any = {}
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = {
        message: error.message,
        name: error.name,
        // Don't include stack in production response
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      }
      
      // Check for SQL errors
      if (error.message.includes('syntax error') || error.message.includes('SQL')) {
        errorMessage = `SQL Error: ${error.message}`
      } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
        errorMessage = `Table not found: ${state.collection}`
      }
    } else {
      errorDetails = String(error)
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
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
