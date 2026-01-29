/// <reference types="@cloudflare/workers-types" />

import { Context, AuthenticatedContext } from '@/shared/types'
import { COLLECTION_GROUPS } from '@/shared/collections'
import { getCollection } from '@/shared/collections/getCollection'
import { preparePassword, validatePassword, validatePasswordMatch } from '@/shared/password'
import { withAdminGuard, withEditorGuard } from '@/shared/api-guard'
import { sql, eq } from 'drizzle-orm'

function isAllowedCollection(name: string): boolean {
  const all = Object.values(COLLECTION_GROUPS).flat()
  return all.includes(name)
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

async function validatePasswordFields(collection: string, data: Record<string, any>, isUpdate: boolean = false): Promise<string | null> {
  const collectionConfig = getCollection(collection)
  
  for (const [fieldName, value] of Object.entries(data)) {
    const columnConfig = (collectionConfig as any)[fieldName]
    if (columnConfig?.options?.type === 'password') {
      // For updates: if password is empty, skip validation (user doesn't want to change it)
      if (isUpdate && (value == null || value === '')) {
        continue
      }
      
      // For creates or non-empty updates: validate
      if (value != null && value !== '') {
        // Check password requirements
        const validation = validatePassword(String(value))
        if (!validation.valid) {
          return `${fieldName}: ${validation.error}`
        }
        
        // Password confirmation is validated on frontend
        // No need for server-side confirmation check
      }
    }
  }
  
  return null
}

async function hashPasswordFields(collection: string, data: Record<string, any>, isUpdate: boolean = false): Promise<void> {
  const collectionConfig = getCollection(collection)
  
  for (const [fieldName, value] of Object.entries(data)) {
    const columnConfig = (collectionConfig as any)[fieldName]
    if (columnConfig?.options?.type === 'password') {
      // For updates: if password is empty, remove it from data (don't update)
      if (isUpdate && (value == null || value === '')) {
        delete data[fieldName]
        delete data[`${fieldName}_confirm`]
        continue
      }
      
      // Hash the password if it's provided
      if (value != null && value !== '') {
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
}

async function handleDelete(context: AuthenticatedContext): Promise<Response> {
  const { env, params } = context
  const collection = params?.collection as string
  const idParam = params?.id as string

  if (!collection || !idParam) {
    return new Response(JSON.stringify({ error: 'Missing collection or id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!isAllowedCollection(collection)) {
    return new Response(JSON.stringify({ error: 'Collection not allowed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Using raw SQL via Drizzle execute/sql since we don't have dynamic table access easily typed
    // NOTE: Be careful with SQL injection here. We trust `collection` because it's checked against allowlist
    // `idParam` is passed as parameter
    
    // Check if table has deleted_at column
    // Postgres-specific way to check columns
    const columnsResult = await env.DB.execute(
      sql`SELECT column_name FROM information_schema.columns WHERE table_name = ${collection} AND column_name = 'deleted_at'`
    );
    
    const hasDeletedAt = columnsResult.length > 0;

    // Get PK column (assuming id usually, or query it)
    // For simplicity, assuming 'id' as primary key or finding one
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


    if (hasDeletedAt) {
      // Soft delete
      await env.DB.execute(
        sql.raw(`UPDATE "${collection}" SET "deleted_at" = NOW() WHERE "${pk}" = '${idParam}'`)
      );
      
      return new Response(JSON.stringify({ success: true, softDeleted: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Hard delete
    const deleteResult = await env.DB.execute(
      sql.raw(`DELETE FROM "${collection}" WHERE "${pk}" = '${idParam}'`)
    );

    return new Response(JSON.stringify({ success: true, softDeleted: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: 'Delete failed', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function handlePut(context: AuthenticatedContext): Promise<Response> {
  const { env, params, request } = context
  const collection = params?.collection as string
  const idParam = params?.id as string

  if (!collection || !idParam) {
    return new Response(JSON.stringify({ error: 'Missing collection or id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!isAllowedCollection(collection)) {
    return new Response(JSON.stringify({ error: 'Collection not allowed' }), {
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

    // Validate password fields (for update mode)
    const passwordError = await validatePasswordFields(collection, body, true)
    if (passwordError) {
      return new Response(JSON.stringify({ error: passwordError }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Hash password fields (for update mode)
    await hashPasswordFields(collection, body, true)

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
    
    // Execute beforeSave hooks for virtual fields first (they modify other fields)
    const virtualFields: string[] = []
    for (const [key, value] of Object.entries(body)) {
      const fieldConfig = (collectionConfig as any)[key]
      if (fieldConfig?.options?.virtual || key.includes('.')) {
        virtualFields.push(key)
        if (fieldConfig?.options?.hooks?.beforeSave) {
          if (value !== undefined) {
            fieldConfig.options.hooks.beforeSave(value, processedBody, context)
            // Debug: log if roles field is being processed
            if (key === 'roles') {
              console.log(`[handlePut] Processing roles field, value:`, value, `roleUuids set to:`, processedBody.roleUuids)
            }
          }
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
          if (result !== undefined) {
            processedBody[key] = result
          }
        }
      }
    }
    
    // After all hooks, ensure dataIn is saved to data_in field
    if (processedBody.dataIn && typeof processedBody.dataIn === 'object') {
      processedBody.data_in = JSON.stringify(processedBody.dataIn)
    }

    // Get table info
    const columnsResult = await env.DB.execute(
       sql`SELECT column_name as name, data_type as type FROM information_schema.columns WHERE table_name = ${collection}`
    ) as unknown as { name: string; type: string }[];

    const columns = columnsResult.map((c) => c.name)
    
    // Get PK
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
    
    const hasUpdatedAt = columns.some((n) => n.toLowerCase() === 'updated_at')

    // Build safe update set from provided body keys that exist in table and are not PK
    const allowedKeys = Object.keys(processedBody).filter((k) => columns.includes(k) && k !== pk)

    const assignments: string[] = []
    
    for (const key of allowedKeys) {
      let value = processedBody[key]
      
      // Stringify JSON fields based on collection config
      const fieldConfig = (collectionConfig as any)[key]
      const isJsonField = fieldConfig?.options?.type === 'json'
      const colInfo = columnsResult.find(c => c.name === key)
      
      // Check if column is timestamp/date/datetime type
      const isTimestampType = colInfo?.type === 'timestamp' || 
                              colInfo?.type === 'timestamp without time zone' ||
                              colInfo?.type === 'timestamp with time zone' ||
                              colInfo?.type === 'date' ||
                              colInfo?.type === 'time'
      
      // Convert empty strings to null for timestamp/date fields
      if (isTimestampType && (value === '' || value === null || value === undefined)) {
        value = null
      }
      
      if (isJsonField && value != null && typeof value === 'object') {
        value = JSON.stringify(value)
      } else if (!isJsonField && value && typeof value === 'object' && colInfo?.type === 'text') {
        // Fallback: stringify object fields in TEXT columns (for backward compatibility)
        value = JSON.stringify(value)
      }
      
      // Handle string escaping for SQL
      // For timestamp fields, if value is null, use NULL, otherwise format as timestamp string
      let escapedValue: string
      if (value === null || value === undefined) {
        escapedValue = 'NULL'
      } else if (isTimestampType && typeof value === 'string') {
        // For timestamp fields, ensure proper format
        if (value === '') {
          escapedValue = 'NULL'
        } else {
          escapedValue = `'${value.replace(/'/g, "''")}'`
        }
      } else if (typeof value === 'string') {
        escapedValue = `'${value.replace(/'/g, "''")}'`
      } else {
        escapedValue = String(value)
      }
      
      assignments.push(`"${key}" = ${escapedValue}`)
    }

    if (hasUpdatedAt) {
      assignments.push(`"updated_at" = NOW()`)
    }

    if (assignments.length === 0) {
      return new Response(JSON.stringify({ error: 'No updatable fields provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const updateSql = `UPDATE "${collection}" SET ${assignments.join(', ')} WHERE "${pk}" = '${idParam}'`;
    
    await env.DB.execute(sql.raw(updateSql));

    // After save hook: create relations for products
    if (collection === 'products' && processedBody.data_in) {
      try {
        const dataIn = typeof processedBody.data_in === 'string' 
          ? JSON.parse(processedBody.data_in)
          : processedBody.data_in

        const assignedLocations = dataIn?.assigned_locations || []
        
        if (Array.isArray(assignedLocations) && assignedLocations.length > 0) {
          // Get product paid identifier
          const productResult = await env.DB.execute(
             sql.raw(`SELECT paid FROM products WHERE "${pk}" = '${idParam}'`)
          );
          const productRecord = productResult[0] as { paid: string };

          if (productRecord?.paid) {
            // Using dynamic import to avoid circular dependencies if any
            const { RelationsRepository } = await import('@/shared/repositories/relations.repository')
            const relationsRepo = RelationsRepository.getInstance(env.DB)

            // Create relations for each assigned location
            for (const locationLaid of assignedLocations) {
              if (locationLaid) {
                await relationsRepo.linkProductToLocation(
                  productRecord.paid,
                  locationLaid,
                  {
                    type: 'PRODUCT_LOCATION',
                    statusName: 'ACTIVE',
                  }
                )
              }
            }
          }
        }
      } catch (relError) {
        console.error('Failed to create product-location relations:', relError)
        // Don't fail the update if relation creation fails
      }
    }

    // Handle many-to-many relationships (e.g., user roles)
    if (collection === 'users') {
      console.log(`[handlePut] Processing users collection, roleUuids:`, processedBody.roleUuids, `body.roles:`, body.roles)
      
      if (processedBody.roleUuids) {
        // Get user UUID from database if not in processedBody
        let userUuid = processedBody.uuid;
        
        if (!userUuid) {
          try {
            const userResult = await env.DB.execute(
              sql.raw(`SELECT uuid FROM "${collection}" WHERE "${pk}" = '${idParam}'`)
            );
            if (userResult && Array.isArray(userResult) && userResult.length > 0) {
              userUuid = userResult[0].uuid;
            }
          } catch (uuidError) {
            console.error("Error fetching user UUID:", uuidError);
          }
        }
        
        console.log(`[handlePut] User UUID:`, userUuid, `Role UUIDs:`, processedBody.roleUuids)
        
        if (userUuid) {
          const roleUuids = processedBody.roleUuids;
          
          try {
            // Delete existing user_roles
            await env.DB.execute(sql.raw(`DELETE FROM "user_roles" WHERE "user_uuid" = '${userUuid}'`));
            
            // Insert new user_roles
            if (Array.isArray(roleUuids) && roleUuids.length > 0) {
              const values = roleUuids.map((roleUuid: string) => `('${userUuid}', '${roleUuid}')`).join(', ');
              await env.DB.execute(sql.raw(`INSERT INTO "user_roles" ("user_uuid", "role_uuid") VALUES ${values}`));
              console.log(`[handlePut] Successfully updated user roles`)
            } else {
              console.log(`[handlePut] No roles to insert (empty array)`)
            }
          } catch (roleError) {
            console.error("Error updating user roles:", roleError);
            // Don't fail the whole update if roles update fails
          }
        } else {
          console.error("Cannot update user roles: user UUID not found");
        }
      } else {
        console.log(`[handlePut] No roleUuids in processedBody, body.roles:`, body.roles)
        // If roles field is explicitly set to empty array, delete all roles
        if (body.roles !== undefined && Array.isArray(body.roles) && body.roles.length === 0) {
          let userUuid = processedBody.uuid;
          if (!userUuid) {
            try {
              const userResult = await env.DB.execute(
                sql.raw(`SELECT uuid FROM "${collection}" WHERE "${pk}" = '${idParam}'`)
              );
              if (userResult && Array.isArray(userResult) && userResult.length > 0) {
                userUuid = userResult[0].uuid;
              }
            } catch (uuidError) {
              console.error("Error fetching user UUID:", uuidError);
            }
          }
          if (userUuid) {
            try {
              await env.DB.execute(sql.raw(`DELETE FROM "user_roles" WHERE "user_uuid" = '${userUuid}'`));
              console.log(`[handlePut] Deleted all roles for user (empty array provided)`)
            } catch (roleError) {
              console.error("Error deleting user roles:", roleError);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Update error", error);
    return new Response(JSON.stringify({ error: 'Update failed', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Allow both Admin and Editor roles for update and delete operations
export const DELETE = withEditorGuard(handleDelete)
export const PUT = withEditorGuard(handlePut)

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}
