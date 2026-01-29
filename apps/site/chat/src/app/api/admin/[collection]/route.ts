/// <reference types="@cloudflare/workers-types" />

import { AuthenticatedContext } from '@/shared/types'
import { COLLECTION_GROUPS } from '@/shared/collections'
import { generateAid } from '@/shared/generate-aid'
import { getCollection } from '@/shared/collections/getCollection'
import { preparePassword, validatePassword, validatePasswordMatch } from '@/shared/password'
import { withAdminGuard, withEditorGuard } from '@/shared/api-guard'
import { sql } from 'drizzle-orm'

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

function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function normalizeFieldName(fieldName: string, dbColumns: string[]): string | null {
  // Check if field name exists in DB columns (case-insensitive)
  const lowerFieldName = fieldName.toLowerCase()
  const matchingColumn = dbColumns.find(col => col.toLowerCase() === lowerFieldName)
  if (matchingColumn) {
    return matchingColumn
  }
  
  // Try converting camelCase to snake_case
  const snakeCase = camelToSnake(fieldName)
  const matchingSnakeColumn = dbColumns.find(col => col.toLowerCase() === snakeCase.toLowerCase())
  if (matchingSnakeColumn) {
    return matchingSnakeColumn
  }
  
  // Try converting snake_case to camelCase (though unlikely to be needed)
  const camelCase = snakeToCamel(fieldName)
  const matchingCamelColumn = dbColumns.find(col => col.toLowerCase() === camelCase.toLowerCase())
  if (matchingCamelColumn) {
    return matchingCamelColumn
  }
  
  return null
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
      
        // Password confirmation is validated on frontend
        // No need for server-side confirmation check
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
        data['salt'] = undefined // Ensure we don't try to save salt for non-user collections if it leaks
      }
      
      // Remove confirmation field from data (it shouldn't be saved to DB)
      delete data[`${fieldName}_confirm`]
    }
  }
}

async function handleGet(context: AuthenticatedContext): Promise<Response> {
  const { env, request, params } = context
  const collection = params?.collection as string

  if (!collection || !isAllowedCollection(collection)) {
    return new Response(JSON.stringify({ error: 'Invalid collection' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('p') || 1))
  const pageSize = Math.max(1, Number(url.searchParams.get('ps') || 20))

  try {
    // Detect if collection has deleted_at
    const columnsResult = await env.DB.execute(
       sql`SELECT column_name as name, data_type as type FROM information_schema.columns WHERE table_name = ${collection}`
    ) as unknown as { name: string; type: string }[];
    
    const hasDeletedAt = columnsResult.some((c) => c.name.toLowerCase() === 'deleted_at')
    const whereClause = hasDeletedAt ? `WHERE "deleted_at" IS NULL` : ''

    const countResult = await env.DB.execute(sql.raw(`SELECT COUNT(*) as total FROM "${collection}" ${whereClause}`));
    const total = Number(countResult[0]?.total || 0);

    const offset = (page - 1) * pageSize
    
    const rowsResult = await env.DB.execute(
      sql.raw(`SELECT * FROM "${collection}" ${whereClause} ORDER BY "id" DESC LIMIT ${pageSize} OFFSET ${offset}`)
    );

    // Parse JSON fields based on collection config
    const collectionConfig = getCollection(collection)
    
    // Get virtual fields from collection config
    const virtualFields: any[] = []
    for (const key in collectionConfig) {
      const fieldConfig = (collectionConfig as any)[key]
      if (fieldConfig?.options?.virtual || key.includes('.')) {
        virtualFields.push({
          name: key,
          config: fieldConfig,
        })
      }
    }
    
    const processedData = await Promise.all(
      (rowsResult || []).map(async (row: any) => {
        const processed = { ...row }
        
        // Get column info for type checking
        const columnsInfo = columnsResult as { name: string; type: string }[] || []
        
        for (const col of columnsInfo) {
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
              console.warn(`Failed to parse JSON field ${col.name} for collection ${collection}`)
            }
          } else if (col.type === 'text' && processed[col.name]) { // PostgreSQL returns 'text' in lowercase usually in information_schema
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
          const fieldConfig = vField.config
          if (fieldConfig?.options?.value) {
            try {
              processed[vField.name] = await fieldConfig.options.value(processed)
            } catch (error) {
              console.error(`Error computing virtual field ${vField.name}:`, error)
              processed[vField.name] = null
            }
          }
        }
        
        return processed
      })
    )

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
    console.error("Query failed", error);
    return new Response(JSON.stringify({ error: 'Query failed', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function handlePost(context: AuthenticatedContext): Promise<Response> {
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
    const virtualFields: string[] = []
    
    // First, separate virtual and non-virtual fields
    for (const [key, value] of Object.entries(body)) {
      const fieldConfig = (collectionConfig as any)[key]
      
      // Collect virtual fields (they don't exist in DB as columns)
      if (fieldConfig?.options?.virtual || key.includes('.')) {
        virtualFields.push(key)
        // Execute beforeChange hook if exists
        if (fieldConfig?.options?.hooks?.beforeChange) {
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
    
    // Execute beforeSave hooks for virtual fields first (they modify other fields)
    for (const key of virtualFields) {
      const fieldConfig = (collectionConfig as any)[key]
      if (fieldConfig?.options?.hooks?.beforeSave) {
        const fieldValue = body[key]
        if (fieldValue !== undefined) {
          fieldConfig.options.hooks.beforeSave(fieldValue, processedBody, context)
        }
      }
    }
    
    // Execute beforeSave hooks for non-virtual fields
    for (const key in collectionConfig) {
      const fieldConfig = (collectionConfig as any)[key]
      // Skip virtual fields - they were already processed
      if (fieldConfig?.options?.virtual || key.includes('.')) {
        continue
      }
      
      if (fieldConfig?.options?.hooks?.beforeSave) {
        const fieldValue = processedBody[key]
        if (fieldValue !== undefined) {
          const result = fieldConfig.options.hooks.beforeSave(fieldValue, processedBody, context)
          // If beforeSave returns a value, it should modify the instance
          if (result !== undefined) {
            processedBody[key] = result
          }
        }
      }
    }

    // Get table schema to detect auto-generated fields
    const columnsResult = await env.DB.execute(
       sql`SELECT column_name as name, data_type as type FROM information_schema.columns WHERE table_name = ${collection}`
    ) as unknown as { name: string; type: string }[];

    // Get PK info
    const pkResult = await env.DB.execute(
      sql`
        SELECT a.attname as name
        FROM   pg_index i
        JOIN   pg_attribute a ON a.attrelid = i.indrelid
                             AND a.attnum = ANY(i.indkey)
        WHERE  i.indrelid = ${collection}::regclass
        AND    i.indisprimary
      `
    );
    const pk = (pkResult[0]?.name as string) || 'id';

    const columns = columnsResult.map(c => ({ ...c, pk: c.name === pk ? 1 : 0 })); // Approximate PK check

    // Normalize field names to match DB columns (snake_case)
    const dbColumnNames = columnsResult.map(c => c.name)
    const data: Record<string, any> = {}
    
    // Copy values from processedBody, normalizing field names to match DB columns
    for (const [key, value] of Object.entries(processedBody)) {
      // Skip virtual fields and nested fields
      if (virtualFields.includes(key) || key.includes('.')) {
        continue
      }
      
      // Find matching DB column name (supports both camelCase and snake_case)
      const dbColumnName = normalizeFieldName(key, dbColumnNames)
      if (dbColumnName) {
        // If both camelCase and snake_case versions exist, merge values
        if (data[dbColumnName] && typeof data[dbColumnName] === 'object' && typeof value === 'object') {
          data[dbColumnName] = { ...data[dbColumnName], ...value }
        } else {
          data[dbColumnName] = value
        }
      }
    }
    
    // After all hooks, ensure dataIn is saved to data_in field
    if (processedBody.dataIn && typeof processedBody.dataIn === 'object') {
      const dbColumnName = normalizeFieldName('data_in', dbColumnNames)
      if (dbColumnName) {
        data[dbColumnName] = processedBody.dataIn // Will be stringified later if needed
      }
    }
    
    // Stringify JSON fields based on collection config
    for (const col of columns) {
      const fieldConfig = (collectionConfig as any)[col.name]
      const isJsonField = fieldConfig?.options?.type === 'json'
      
      // Check both original and normalized field names
      const fieldValue = data[col.name] ?? data[camelToSnake(col.name)] ?? data[snakeToCamel(col.name)]
      
      if (isJsonField && fieldValue != null && typeof fieldValue === 'object') {
        data[col.name] = JSON.stringify(fieldValue)
      } else if (!isJsonField && fieldValue && typeof fieldValue === 'object' && col.type === 'text') {
        // Fallback: stringify object fields in TEXT columns (for backward compatibility)
        data[col.name] = JSON.stringify(fieldValue)
      } else if (fieldValue !== undefined && !data[col.name]) {
        data[col.name] = fieldValue
      }
    }

    // Auto-generate id, uuid, {x}aid if they exist in schema and not provided
    for (const col of columns) {
      const lowerName = col.name.toLowerCase()
      if (!data[col.name]) {
        if (lowerName === 'id' && col.pk === 1) {
          // Skip primary key id, let DB auto-increment
          continue
        }
        if (lowerName === 'uuid') {
          data[col.name] = generateUUID()
        } else if (lowerName.endsWith('aid')) {
          // Generate AID for columns like raid, haid, uaid, aid
          // Extract prefix: raid -> 'r', haid -> 'h', aid -> 'a'
          const prefix = lowerName.length === 4 ? lowerName[0] : 'a'
          data[col.name] = generateAid(prefix)
        } else if (lowerName === 'created_at' || lowerName === 'updated_at') {
          data[col.name] = new Date().toISOString()
        } else if (lowerName === 'deleted_at') {
          // Leave deleted_at as NULL for new records
          data[col.name] = null
        }
      }
    }

    // Filter out virtual fields and fields with dots before SQL construction
    const keys = Object.keys(data).filter(k => {
      // Remove virtual fields
      if (virtualFields.includes(k)) return false
      // Remove fields with dots (nested fields like "title.ru")
      if (k.includes('.')) return false
      // Remove fields that don't exist in database columns
      if (!dbColumnNames.includes(k)) return false
      return true
    })
    const values = keys.map((k) => data[k])
    
    // Construct SQL manually for dynamic insertion
    const columnsList = keys.map(k => `"${k}"`).join(', ')
    const valuePlaceholders = keys.map(k => {
        const val = data[k];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        return val;
    }).join(', ');

    const sqlQuery = `INSERT INTO "${collection}" (${columnsList}) VALUES (${valuePlaceholders}) RETURNING "${pk}", uuid`
    
    const result = await env.DB.execute(sql.raw(sqlQuery));

    // Handle many-to-many relationships (e.g., user roles)
    if (collection === 'users' && processedBody.roleUuids) {
      // Get the created user's UUID
      let userUuid = processedBody.uuid;
      
      // If UUID was auto-generated, fetch it from the result
      if (!userUuid && result && Array.isArray(result) && result.length > 0) {
        userUuid = result[0].uuid;
      }
      
      // If still no UUID, try to get it from the insert result
      if (!userUuid) {
        // Try to get the last inserted user
        const lastUserResult = await env.DB.execute(
          sql.raw(`SELECT uuid FROM "${collection}" ORDER BY id DESC LIMIT 1`)
        );
        if (lastUserResult && Array.isArray(lastUserResult) && lastUserResult.length > 0) {
          userUuid = lastUserResult[0].uuid;
        }
      }
      
      if (userUuid) {
        const roleUuids = processedBody.roleUuids;
        
        try {
          // Insert user_roles
          if (Array.isArray(roleUuids) && roleUuids.length > 0) {
            const values = roleUuids.map((roleUuid: string) => `('${userUuid}', '${roleUuid}')`).join(', ');
            await env.DB.execute(sql.raw(`INSERT INTO "user_roles" ("user_uuid", "role_uuid") VALUES ${values}`));
          }
        } catch (roleError) {
          console.error("Error creating user roles:", roleError);
          // Don't fail the whole create if roles creation fails
        }
      }
    }

    // After save hook: create relations for products

    return new Response(JSON.stringify({ 
      success: true, 
      lastRowId: result[0]?.[pk] || null,
      generated: Object.keys(data).filter(k => !body[k]),
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Insert failed", error);
    return new Response(JSON.stringify({ error: 'Insert failed', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Allow both Admin and Editor roles for collection CRUD operations
export const GET = withEditorGuard(handleGet)
export const POST = withEditorGuard(handlePost)

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}
