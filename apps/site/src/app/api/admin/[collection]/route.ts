/// <reference types="@cloudflare/workers-types" />

import { AuthenticatedContext } from '@/shared/types'
import { COLLECTION_GROUPS } from '@/shared/collections'
import { generateAid } from '@/shared/generate-aid'
import { getCollection } from '@/shared/collections/getCollection'
import { preparePassword, validatePassword, validatePasswordMatch } from '@/shared/password'
import { withAdminGuard, AuthenticatedRequestContext } from '@/shared/api-guard'
import { getPostgresClient, executeRawQuery } from '@/shared/repositories/utils'
import { buildRequestEnv } from '@/shared/env'

function isAllowedCollection(name: string): boolean {
  const all = Object.values(COLLECTION_GROUPS).flat()
  return all.includes(name)
}

function q(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"'
}

function generateUUID(): string {
  return crypto.randomUUID()
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateEmailFields(collection: string, data: Record<string, any>): string | null {
  const collectionConfig = getCollection(collection)
  
  for (const [fieldName, value] of Object.entries(data)) {
    const columnConfig = (collectionConfig as any)[fieldName]
    if (columnConfig?.options?.type === 'email' && value != null && value !== '') {
      if (!isValidEmail(String(value))) {
        return `Invalid email format for field: ${fieldName}`
      }
    }
  }
  
  return null
}

async function validatePasswordFields(collection: string, data: Record<string, any>): Promise<string | null> {
  const collectionConfig = getCollection(collection)
  
  for (const [fieldName, value] of Object.entries(data)) {
    const columnConfig = (collectionConfig as any)[fieldName]
    if (columnConfig?.options?.type === 'password' && value != null && value !== '') {
      // Check password requirements
      const validation = validatePassword(String(value))
      if (!validation.valid) {
        return `${fieldName}: ${validation.error}`
      }
      
      // Check for confirmation field
      const confirmFieldName = `${fieldName}_confirm`
      const confirmValue = data[confirmFieldName]
      
      if (!confirmValue) {
        return `${fieldName}: Password confirmation is required`
      }
      
      // Check passwords match
      const matchValidation = validatePasswordMatch(String(value), String(confirmValue))
      if (!matchValidation.valid) {
        return `${fieldName}: ${matchValidation.error}`
      }
    }
  }
  
  return null
}

async function hashPasswordFields(collection: string, data: Record<string, any>): Promise<void> {
  const collectionConfig = getCollection(collection)
  
  for (const [fieldName, value] of Object.entries(data)) {
    const columnConfig = (collectionConfig as any)[fieldName]
    if (columnConfig?.options?.type === 'password' && value != null && value !== '') {
      // For users collection, use preparePassword to generate hash and salt
      if (collection === 'users' && fieldName === 'password_hash') {
        const { hashedPassword, salt } = await preparePassword(String(value))
        data[fieldName] = hashedPassword
        data['salt'] = salt
      } else {
        // For other collections or fields, use preparePassword but only save hash
        const { hashedPassword } = await preparePassword(String(value))
        data[fieldName] = hashedPassword
      }
      
      // Remove confirmation field from data (it shouldn't be saved to DB)
      delete data[`${fieldName}_confirm`]
    }
  }
}

async function handleGet(context: AuthenticatedRequestContext): Promise<Response> {
  const { request, params } = context
  const collection = params?.collection as string
  const env = buildRequestEnv()
  if (!collection || !isAllowedCollection(collection)) {
    return new Response(JSON.stringify({ error: 'Invalid collection' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('p') || 1))
  const pageSize = Math.max(1, Number(url.searchParams.get('ps') || 20))

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database connection not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const client = getPostgresClient(env.DB)
    
    // Detect if collection has deleted_at
    const pragmaResult = await executeRawQuery<{ column_name: string; data_type: string }>(
      client,
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = $1`,
      [collection]
    )
    const hasDeletedAt = Boolean(pragmaResult?.some((c: { column_name: string }) => c.column_name.toLowerCase() === 'deleted_at'))
    const where = hasDeletedAt ? `WHERE ${q('deleted_at')} IS NULL` : ''

    const countResult = await executeRawQuery<{ total: string | number }>(
      client,
      `SELECT COUNT(*) as total FROM ${q(collection)} ${where}`
    )
    const total = Number(countResult[0]?.total) || 0

    const offset = (page - 1) * pageSize
    const rowsResult = await executeRawQuery(
      client,
      `SELECT * FROM ${q(collection)} ${where} LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    )

    // Parse JSON fields based on collection config
    const collectionConfig = getCollection(collection)
    const processedData = (rowsResult || []).map((row: any) => {
      const processed = { ...row }
      
      // Get column info for type checking
      const columnsInfo = pragmaResult as { column_name: string; data_type: string }[] || []
      
      for (const col of columnsInfo) {
        const fieldConfig = (collectionConfig as any)[col.column_name]
        const isJsonField = fieldConfig?.options?.type === 'json'
        
        if (isJsonField && processed[col.column_name] != null) {
          try {
            const value = processed[col.column_name]
            if (typeof value === 'string') {
              processed[col.column_name] = JSON.parse(value)
            }
          } catch {
            // Not valid JSON, keep as is
            console.warn(`Failed to parse JSON field ${col.column_name} for collection ${collection}`)
          }
        } else if (col.data_type === 'text' && processed[col.column_name]) {
          // Fallback: try parsing TEXT fields that look like JSON (for backward compatibility)
          try {
            const value = processed[col.column_name]
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
              processed[col.column_name] = JSON.parse(value)
            }
          } catch {
            // Not JSON, keep as is
          }
        }
      }
      
      return processed
    })

    return new Response(JSON.stringify({
      success: true,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: processedData,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Query failed', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function handlePost(context: AuthenticatedRequestContext): Promise<Response> {
  const { env, params, request } = context
  const collection = params?.collection as string

  if (!collection || !isAllowedCollection(collection)) {
    return new Response(JSON.stringify({ error: 'Invalid collection' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json() as Record<string, any>
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate email fields
    const emailError = validateEmailFields(collection, body)
    if (emailError) {
      return new Response(JSON.stringify({ error: emailError }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate password fields
    const passwordError = await validatePasswordFields(collection, body)
    if (passwordError) {
      return new Response(JSON.stringify({ error: passwordError }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Hash password fields
    await hashPasswordFields(collection, body)

    // Process hooks and virtual fields
    const collectionConfig = getCollection(collection)
    const processedBody: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(body)) {
      const fieldConfig = (collectionConfig as any)[key]
      
      // Skip virtual fields (they don't exist in DB)
      if (fieldConfig?.options?.virtual) {
        // Execute beforeChange hook if exists
        if (fieldConfig.options.hooks?.beforeChange) {
          fieldConfig.options.hooks.beforeChange(value, body)
        }
        continue
      }
      
      // Execute beforeChange hook for non-virtual fields
      if (fieldConfig?.options?.hooks?.beforeChange) {
        processedBody[key] = fieldConfig.options.hooks.beforeChange(value, body)
      } else {
        processedBody[key] = value
      }
    }
    
    // Parse JSON fields in processedBody to objects for beforeSave hooks (especially virtual fields)
    for (const key in processedBody) {
      const fieldConfig = (collectionConfig as any)[key]
      if (fieldConfig?.options?.type === 'json' && processedBody[key] != null) {
        const value = processedBody[key]
        if (typeof value === 'string') {
          try {
            processedBody[key] = JSON.parse(value)
          } catch {
            // Not valid JSON, keep as is
          }
        }
      }
    }
    
    // Execute beforeSave hooks for all fields (including virtual ones that modify other fields)
    for (const key in collectionConfig) {
      const fieldConfig = (collectionConfig as any)[key]
      if (fieldConfig?.options?.hooks?.beforeSave) {
        const fieldValue = body[key]
        if (fieldValue !== undefined) {
          const result = fieldConfig.options.hooks.beforeSave(fieldValue, processedBody, context)
          // If beforeSave returns a value, it should modify the instance
          // Virtual fields can modify other fields in processedBody
          if (result !== undefined && !fieldConfig?.options?.virtual) {
            processedBody[key] = result
          }
        }
      }
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database connection not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const client = getPostgresClient(env.DB)
    
    // Get table schema to detect auto-generated fields
    const pragmaResult = await executeRawQuery<{
      column_name: string;
      data_type: string;
      ordinal_position: number;
    }>(
      client,
      `SELECT column_name, data_type, ordinal_position
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [collection]
    )
    
    // Get primary key from information_schema
    const pkResult = await executeRawQuery<{ column_name: string }>(
      client,
      `SELECT column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY'
         AND tc.table_name = $1
       LIMIT 1`,
      [collection]
    )

    const pkColumn = pkResult[0]?.column_name || 'id'
    const columns = pragmaResult || []
    const data: Record<string, any> = { ...processedBody }
    
    // Stringify JSON fields based on collection config
    for (const col of columns) {
      const fieldConfig = (collectionConfig as any)[col.column_name]
      const isJsonField = fieldConfig?.options?.type === 'json'
      
      if (isJsonField && data[col.column_name] != null && typeof data[col.column_name] === 'object') {
        data[col.column_name] = JSON.stringify(data[col.column_name])
      } else if (!isJsonField && data[col.column_name] && typeof data[col.column_name] === 'object' && col.data_type === 'text') {
        // Fallback: stringify object fields in TEXT columns (for backward compatibility)
        data[col.column_name] = JSON.stringify(data[col.column_name])
      }
    }

    // Auto-generate id, uuid, {x}aid if they exist in schema and not provided
    for (const col of columns) {
      const lowerName = col.column_name.toLowerCase()
      if (!data[col.column_name]) {
        if (lowerName === 'id' && col.column_name === pkColumn) {
          // Skip primary key id, let DB auto-increment
          continue
        }
        if (lowerName === 'uuid') {
          data[col.column_name] = generateUUID()
        } else if (lowerName.endsWith('aid')) {
          // Generate AID for columns like raid, haid, uaid, aid
          // Extract prefix: raid -> 'r', haid -> 'h', aid -> 'a'
          const prefix = lowerName.length === 4 ? lowerName[0] : 'a'
          data[col.column_name] = generateAid(prefix)
        } else if (lowerName === 'created_at' || lowerName === 'updated_at') {
          data[col.column_name] = new Date().toISOString()
        } else if (lowerName === 'deleted_at') {
          // Leave deleted_at as NULL for new records
          data[col.column_name] = null
        }
      }
    }

    const keys = Object.keys(data)
    const values = keys.map((k) => data[k])
    
    // Build SQL with parameterized query
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
    const sql = `INSERT INTO ${q(collection)} (${keys.map(q).join(', ')}) VALUES (${placeholders}) RETURNING id`

    const result = await executeRawQuery<{ id: number }>(client, sql, values)
    const lastRowId = result[0]?.id

    // Auto-assign sort_order = id * 100 for taxonomy collection if sort_order is empty/null/0
    if (collection === 'taxonomy' && lastRowId) {
      const sortOrderValue = data.sort_order
      const needsAutoOrder = sortOrderValue === null || sortOrderValue === undefined || sortOrderValue === 0 || sortOrderValue === ''
      
      if (needsAutoOrder) {
        const autoSortOrder = lastRowId * 100
        await executeRawQuery(
          client,
          `UPDATE ${q(collection)} SET sort_order = $1 WHERE id = $2`,
          [autoSortOrder, lastRowId]
        )
        // Update data object for response
        data.sort_order = autoSortOrder
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      lastRowId: lastRowId || null,
      generated: Object.keys(data).filter(k => !body[k]),
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Insert failed', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const GET = withAdminGuard(handleGet)
export const POST = withAdminGuard(handlePost)

export const onRequestOptions = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })

export async function OPTIONS() {
  return onRequestOptions()
}
