/**
 * Seed script for media table
 * Reads files from public/images and creates media records
 */

import { readdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateAid } from '../generate-aid'
import { sql } from 'drizzle-orm'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function seedMedia(db: any): Promise<{ synced: number; skipped: number; total: number }> {
  try {
    // Try multiple possible paths for public/images directory
    // In Next.js, process.cwd() points to apps/site directory
    const possiblePaths = [
      path.join(process.cwd(), 'public/images'), // From apps/site root
      path.join(__dirname, '../../../public/images'), // Relative to this file
      path.join(process.cwd(), '..', '..', 'apps', 'site', 'public', 'images'), // From monorepo root
    ]
    
    let imagesDir: string | null = null
    let files: string[] = []
    
    console.log('🔍 process.cwd():', process.cwd())
    console.log('🔍 __dirname:', __dirname)
    
    // Try each path until we find one that works
    for (const dirPath of possiblePaths) {
      try {
        const resolvedPath = path.resolve(dirPath)
        console.log(`🔍 Trying path: ${resolvedPath}`)
        
        // Check if directory exists using fs.stat
        const { stat } = await import('fs/promises')
        const stats = await stat(resolvedPath)
        if (!stats.isDirectory()) {
          console.log(`❌ Path is not a directory: ${resolvedPath}`)
          continue
        }
        
        files = await readdir(resolvedPath)
        imagesDir = resolvedPath
        console.log(`✅ Found directory at: ${resolvedPath}`)
        console.log(`📦 Found ${files.length} files in directory`)
        break
      } catch (error: any) {
        console.log(`❌ Path not found: ${dirPath} - ${error.message}`)
        console.log(`❌ Error code: ${error.code}`)
        continue
      }
    }
    
    if (!imagesDir) {
      throw new Error(`Cannot find images directory. Tried: ${possiblePaths.join(', ')}`)
    }
    
    console.log(`📁 Using images directory: ${imagesDir}`)
    console.log(`📦 Found ${files.length} files`)
    
    // Filter only image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)
    })
    
    console.log(`🖼️  Found ${imageFiles.length} image files`)
    console.log(`📋 First 10 files:`, imageFiles.slice(0, 10))
    
    if (imageFiles.length === 0) {
      console.log('⚠️  No image files found in public/images directory')
      console.log('📋 All files found:', files.slice(0, 20))
      console.log('📋 File extensions found:', [...new Set(files.map(f => path.extname(f).toLowerCase()))])
      return { synced: 0, skipped: 0, total: 0 }
    }

    // Get all existing media filenames using sql template
    console.log('🔍 Checking existing media in database...')
    const existingMedia = await db.execute(
      sql`SELECT "file_name" FROM "media" WHERE "deleted_at" IS NULL`
    ) as unknown as { file_name: string }[]

    console.log(`📊 Found ${existingMedia.length} existing media records in database`)
    const existingFiles = new Set(existingMedia.map(m => m.file_name))
    console.log('📋 Existing files:', Array.from(existingFiles).slice(0, 5), '...')

    let syncedCount = 0
    let skippedCount = 0
    let errorCount = 0
    const now = new Date().toISOString()

    console.log(`\n🔄 Starting sync of ${imageFiles.length} image files...`)

    // Sync each file
    for (const fileName of imageFiles) {
      let uuid: string | undefined
      let mimeType: string | undefined
      
      try {
        // Skip if already exists
        if (existingFiles.has(fileName)) {
          skippedCount++
          if (skippedCount <= 5) {
            console.log(`⏭️  Skipped (already exists): ${fileName}`)
          }
          continue
        }

        // Determine MIME type from extension
        const ext = fileName.toLowerCase().split('.').pop() || ''
        const mimeTypeMap: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'svg': 'image/svg+xml'
        }
        mimeType = `image/${mimeTypeMap[ext] || 'jpeg'}`

        // Generate UUID
        uuid = generateAid('m')

        // Log first few inserts for debugging
        if (syncedCount + errorCount < 3) {
          console.log(`🔍 Preparing to insert: ${fileName}`)
          console.log(`   UUID: ${uuid}`)
          console.log(`   MIME: ${mimeType}`)
          console.log(`   Now: ${now}`)
        }

        // Insert new media record using sql template
        // Note: created_at and updated_at are text fields in schema, so we pass ISO string
        // Use same syntax as upload/route.ts which works
        let insertResult
        try {
          insertResult = await db.execute(
            sql`INSERT INTO "media" (
              "uuid", "file_name", "mime_type", 
              "type", "is_public", "created_at", "updated_at"
            ) VALUES (
              ${uuid}, ${fileName}, ${mimeType},
              ${'image'}, ${1}, ${now}, ${now}
            )`
          )
        } catch (insertError: any) {
          // Log insert error immediately
          if (errorCount < 5) {
            console.error(`❌ INSERT ERROR for ${fileName}:`, insertError.message)
            console.error(`   Code:`, insertError.code)
            console.error(`   Name:`, insertError.name)
            console.error(`   SQL State:`, insertError.code)
            console.error(`   Detail:`, insertError.detail)
            console.error(`   Hint:`, insertError.hint)
            console.error(`   Position:`, insertError.position)
          }
          throw insertError
        }
        
        // Check if insert was successful (some DB drivers return empty array on success)
        if (insertResult === undefined || insertResult === null) {
          throw new Error(`Insert returned undefined/null for ${fileName}`)
        }
        
        if (syncedCount + errorCount < 3) {
          console.log(`✅ Insert result:`, insertResult)
        }

        syncedCount++
        if (syncedCount <= 5 || syncedCount % 10 === 0) {
          console.log(`✅ Synced: ${fileName} (${syncedCount}/${imageFiles.length})`)
        }
      } catch (error: any) {
        errorCount++
        // Always log first 10 errors with full details
        if (errorCount <= 10) {
          console.error(`\n❌ Error #${errorCount} syncing ${fileName}:`)
          console.error(`   Message:`, error.message)
          console.error(`   Code:`, error.code)
          console.error(`   Name:`, error.name)
          if (error.stack) {
            console.error(`   Stack (first 5 lines):`, error.stack.split('\n').slice(0, 5).join('\n'))
          }
          console.error(`   Params:`, JSON.stringify({ uuid, fileName, mimeType, now }, null, 2))
        } else if (errorCount === 11) {
          console.error(`\n⚠️  Too many errors. Suppressing further error details...`)
        }
      }
    }

    console.log(`\n✅ Media seed completed:`)
    console.log(`   📥 Synced: ${syncedCount}`)
    console.log(`   ⏭️  Skipped: ${skippedCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📊 Total: ${imageFiles.length}`)
    return { synced: syncedCount, skipped: skippedCount, total: imageFiles.length }
  } catch (error) {
    console.error('❌ Error seeding media:', error)
    throw error
  }
}

