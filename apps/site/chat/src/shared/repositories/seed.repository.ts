import { eq, and, sql } from 'drizzle-orm'
import type { D1Database } from '@cloudflare/workers-types'
import { schema } from '../schema'
import { createDb, stringifyJson,  type SiteDb } from './utils'

type SeedRecord = Record<string, unknown> & { uuid: string }

export type SeedResult = {
  inserted: number
  updated: number
  skipped: number
  errors: number
}

export class SeedRepository {
  private static instance: SeedRepository | null = null
  private readonly db: SiteDb
  private readonly d1Db: D1Database | null

  private constructor(db: D1Database | SiteDb | null = null) {
    this.d1Db = (db && 'prepare' in db) ? db as D1Database : null
    this.db = createDb(db)
  }

  public static getInstance(db: D1Database | SiteDb): SeedRepository {
    if (!SeedRepository.instance) {
      SeedRepository.instance = new SeedRepository(db)
    }
    return SeedRepository.instance
  }

  /**
   * Seeds data for a specific collection
   */
  async seedCollection(
    collectionName: string,
    records: SeedRecord[]
  ): Promise<SeedResult> {
    const result: SeedResult = { inserted: 0, updated: 0, skipped: 0, errors: 0 }

    // Map collection name to schema table
    const table = (schema as Record<string, unknown>)[collectionName]
    if (!table) {
      console.warn(`Collection '${collectionName}' not found in schema`)
      result.errors = records.length
      return result
    }

    // Process each record
    for (const record of records) {
      try {
        // Determine existence condition
        let existing: any[] = []
        let shouldUpdate = false

        // Special handling for news articles: find by slug in data_in
        if (collectionName === 'texts' && (record as any).type === 'news') {
          const dataIn = (record as any).data_in
          let slug: string | null = null

          // Extract slug from data_in (can be string JSON or object)
          if (dataIn) {
            try {
              const parsed = typeof dataIn === 'string' ? JSON.parse(dataIn) : dataIn
              slug = parsed?.slug || null
            } catch {
              // If parsing fails, try to extract slug using string matching
              const dataInStr = typeof dataIn === 'string' ? dataIn : JSON.stringify(dataIn)
              const slugMatch = dataInStr.match(/"slug"\s*:\s*"([^"]+)"/)
              slug = slugMatch ? slugMatch[1] : null
            }
          }

          if (!slug) {
            console.warn(`News article missing slug in data_in, skipping`)
            result.errors++
            continue
          }

            // Search for existing record by slug in data_in JSON
            const tableName = (table as any)?._?.name || collectionName
            
            const searchPattern = `%"slug":"${slug}"%`
            
            // Use Drizzle raw query for JSON search compatibility
            const existingResult = await this.db.execute(
              sql.raw(`SELECT * FROM "${tableName}" WHERE type = 'news' AND data_in::text LIKE '${searchPattern}' AND deleted_at IS NULL LIMIT 1`)
            )

            if (existingResult[0]) {
                const found = existingResult[0] as any;
                // Ensure we have the record in the format expected by Drizzle
                // Convert snake_case to camelCase for consistency
                const normalizedRecord = {
                  ...found,
                  createdAt: found.created_at || found.createdAt,
                  updatedAt: found.updated_at || found.updatedAt,
                }
                existing = [normalizedRecord]
                shouldUpdate = true
            }
        } else if (collectionName === 'taxonomy' && !(table as any).uuid) {
          const entity = (record as any).entity
          const name = (record as any).name
          if (!entity || !name) {
            console.warn(`Record in 'taxonomy' missing entity or name, skipping`)
            result.errors++
            continue
          }
          existing = await this.db
            .select()
            .from(table as any)
            .where(and(eq((table as any).entity, entity), eq((table as any).name, name)))
            .limit(1)
        } else if (collectionName === 'settings') {
          const attribute = (record as any).attribute
          if (!attribute) {
            console.warn(`Record in 'settings' missing attribute, skipping`)
            result.errors++
            continue
          }
          existing = await this.db
            .select()
            .from(table as any)
            .where(eq((table as any).attribute, attribute))
            .limit(1)
        } else {
          const uuid = record.uuid
          if (!uuid) {
            console.warn(`Record in '${collectionName}' missing uuid, skipping`)
            result.errors++
            continue
          }
          existing = await this.db
            .select()
            .from(table as any)
            .where(eq((table as any).uuid, uuid))
            .limit(1)
        }

        // Prepare record for insertion/update
        let preparedRecord = this.prepareRecord(record)
        if (collectionName === 'taxonomy' && !(table as any).uuid) {
          // Remove uuid if provided in seed to avoid unknown column insert
          const { uuid: _omit, ...rest } = preparedRecord as any
          preparedRecord = rest
        }

        if (existing.length > 0) {
          if (shouldUpdate || collectionName === 'products' || collectionName === 'settings') {
            // Update existing record (for news articles, products, and settings)
            const existingRecord = existing[0]
            // Remove fields that shouldn't be updated
            const { uuid, createdAt, ...updateFields } = preparedRecord as any
            
            // Get existing createdAt from database (could be created_at or createdAt)
            // SQLite returns snake_case, but we need to handle both
            const existingCreatedAt = existingRecord.created_at || existingRecord.createdAt
            
            // Keep the existing UUID and created_at from the database, update the rest
            // If createdAt doesn't exist or is invalid, set it to current timestamp
            const createdAtValue = existingCreatedAt && existingCreatedAt !== 'null' && existingCreatedAt !== ''
              ? existingCreatedAt
              : sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
            
            // Use attribute for settings, uuid for others
            const whereCondition = collectionName === 'settings'
              ? eq((table as any).attribute, (record as any).attribute)
              : eq((table as any).uuid, existingRecord.uuid)
            
            await this.db
              .update(table as any)
              .set({
                ...updateFields,
                // Preserve existing createdAt from database, or set new one if missing
                createdAt: createdAtValue,
                updatedAt: sql`NOW()`,
              })
              .where(whereCondition)
            result.updated++
          } else {
            result.skipped++
          }
          continue
        }

        // Insert new record
        // Ensure created_at and updated_at are set for new records
        const insertRecord = {
          ...preparedRecord,
          createdAt: sql`NOW()`,
          updatedAt: sql`NOW()`,
        }
        await this.db.insert(table as any).values(insertRecord)
        result.inserted++
      } catch (error) {
        console.error(
          `Error processing record in '${collectionName}':`,
          error,
          record
        )
        result.errors++
      }
    }

    return result
  }

  /**
   * Seeds collection using direct SQL queries (for tables without Drizzle schema)
   */
  private async seedCollectionWithSQL(
    collectionName: string,
    records: SeedRecord[]
  ): Promise<SeedResult> {
    const result: SeedResult = { inserted: 0, updated: 0, skipped: 0, errors: 0 }

    for (const record of records) {
      try {
        const uuid = record.uuid
        if (!uuid) {
          console.warn(`Record in '${collectionName}' missing uuid, skipping`)
          result.errors++
          continue
        }

        // Check if record exists by uuid
        let existing: any[] = []
        try {
          const existingResult = await this.db.execute(
            sql.raw(`SELECT * FROM "${collectionName}" WHERE uuid = '${uuid.replace(/'/g, "''")}' AND deleted_at IS NULL LIMIT 1`)
          ) as unknown as any[]
          existing = existingResult || []
        } catch (error) {
          console.error(`Error checking existing record in '${collectionName}':`, error)
          // Continue anyway, assume record doesn't exist
        }

        // Prepare record - convert to snake_case for database
        const preparedRecord: Record<string, string> = {}
        for (const [key, value] of Object.entries(record)) {
          // Keep snake_case keys as is, or convert camelCase to snake_case
          const dbKey = key.includes('_') ? key : this.camelToSnake(key)
          
          // Handle JSON fields and escape strings
          if (dbKey === 'data_in' || dbKey === 'data_out' || dbKey === 'gin') {
            const jsonValue = typeof value === 'string' ? value : JSON.stringify(value)
            preparedRecord[dbKey] = `'${jsonValue.replace(/'/g, "''")}'`
          } else if (value === null || value === undefined) {
            preparedRecord[dbKey] = 'NULL'
          } else if (typeof value === 'string') {
            preparedRecord[dbKey] = `'${value.replace(/'/g, "''")}'`
          } else {
            preparedRecord[dbKey] = String(value)
          }
        }

        // Ensure timestamps
        const now = new Date().toISOString()
        if (!preparedRecord.created_at) {
          preparedRecord.created_at = `'${now}'`
        }
        if (!preparedRecord.updated_at) {
          preparedRecord.updated_at = `'${now}'`
        }

        if (existing.length > 0) {
          // Update existing record
          const existingRecord = existing[0]
          const existingCreatedAt = existingRecord.created_at || existingRecord.updated_at
          
          // Build UPDATE query
          const updateFields: string[] = []
          
          for (const [key, value] of Object.entries(preparedRecord)) {
            if (key !== 'uuid' && key !== 'id') {
              updateFields.push(`${key} = ${value}`)
            }
          }
          
          updateFields.push(`updated_at = '${now}'`)
          
          if (existingCreatedAt) {
            const createdAtValue = typeof existingCreatedAt === 'string' 
              ? existingCreatedAt.replace(/'/g, "''") 
              : new Date(existingCreatedAt).toISOString()
            updateFields.push(`created_at = '${createdAtValue}'`)
          }
          
          await this.db.execute(
            sql.raw(`UPDATE "${collectionName}" SET ${updateFields.join(', ')} WHERE uuid = '${uuid.replace(/'/g, "''")}'`)
          )
          result.updated++
        } else {
          // Insert new record
          const insertFields = Object.keys(preparedRecord)
          const insertValues = insertFields.map(key => preparedRecord[key])
          
          await this.db.execute(
            sql.raw(`INSERT INTO "${collectionName}" (${insertFields.join(', ')}) VALUES (${insertValues.join(', ')})`)
          )
          result.inserted++
        }
      } catch (error) {
        console.error(
          `Error processing record in '${collectionName}':`,
          error,
          record
        )
        result.errors++
      }
    }

    return result
  }

  /**
   * Converts camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }

  /**
   * Seeds multiple collections from data object
   */
  async seedMultiple(
    data: Record<string, SeedRecord[]>,
    clearBeforeSeed: boolean = false
  ): Promise<Record<string, SeedResult>> {
    const results: Record<string, SeedResult> = {}

    // Clear collections before seeding if requested
    if (clearBeforeSeed) {
      for (const collectionName of Object.keys(data)) {
        await this.clearCollection(collectionName)
      }
    }

    for (const [collectionName, records] of Object.entries(data)) {
    
      results[collectionName] = await this.seedCollection(collectionName, records)
    }

    return results
  }

  /**
   * Clears all records from a collection
   */
  async clearCollection(collectionName: string): Promise<void> {
    const table = (schema as Record<string, unknown>)[collectionName]
    if (!table) {
      console.warn(`Collection '${collectionName}' not found in schema, cannot clear`)
      return
    }

    try {
      // Use Drizzle delete
      // Get table name from Drizzle table object
      const tableName = (table as any)?._?.name || collectionName

      // Delete all records from the table
      // await this.db.delete(table as any) // This might fail if no where clause, use raw sql truncate/delete
      await this.db.execute(sql.raw(`DELETE FROM "${tableName}"`))
      console.log(`Cleared all records from '${tableName}' (collection: ${collectionName})`)
    } catch (error) {
      console.error(`Error clearing collection '${collectionName}':`, error)
      throw error
    }
  }

  /**
   * Checks if a record exists by uuid
   */
  async exists(collectionName: string, uuid: string): Promise<boolean> {
    const table = (schema as Record<string, unknown>)[collectionName]
    if (!table) {
      return false
    }

    const existing = await this.db
      .select()
      .from(table as any)
      .where(eq((table as any).uuid, uuid))
      .limit(1)

    return existing.length > 0
  }

  /**
   * Prepares a record for database insertion
   * Converts snake_case to camelCase and handles special fields
   */
  private prepareRecord(record: SeedRecord): Record<string, unknown> {
    const prepared: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(record)) {
      // Convert snake_case to camelCase
      const camelKey = this.snakeToCamel(key)

      // Handle JSON fields
      if (camelKey === 'dataIn' || camelKey === 'dataOut' || camelKey === 'gin') {
        prepared[camelKey] = typeof value === 'string' ? value : stringifyJson(value)
      }
      // Handle boolean fields
      else if (camelKey === 'isSystem' || camelKey === 'isActive' || camelKey === 'kit') {
        prepared[camelKey] = value ? 1 : 0
      }
      // Regular fields
      else {
        prepared[camelKey] = value
      }
    }

    if(!prepared.created_at) {
      prepared.created_at = new Date().toISOString()
    }
    if(!prepared.updated_at) {
      prepared.updated_at = new Date().toISOString()
    }
    if(!prepared.createdAt) {
      prepared.createdAt = new Date().toISOString()
    }
    if(!prepared.updatedAt) {
      prepared.updatedAt = new Date().toISOString()
    }

    return prepared
  }

  /**
   * Converts snake_case to camelCase
   */
  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }
}
