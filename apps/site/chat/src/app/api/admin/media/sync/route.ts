/// <reference types="@cloudflare/workers-types" />

import { AuthenticatedContext } from '@/shared/types'
import { withAdminGuard } from '@/shared/api-guard'
import { generateAid } from '@/shared/generate-aid'
import { sql } from 'drizzle-orm'

async function handlePost(context: AuthenticatedContext): Promise<Response> {
  const { env, request } = context

  try {
    // Try to get file list from request body (optional)
    const body = (await request.json().catch(() => ({}))) as { files?: string[] }
    const fileList = body.files

    // If file list provided, sync those files
    if (fileList && Array.isArray(fileList) && fileList.length > 0) {
      let syncedCount = 0
      let skippedCount = 0
      const now = new Date().toISOString()

      // Get all existing media filenames
      const existingMedia = await env.DB.execute(
        sql`SELECT "file_name" FROM "media" WHERE "deleted_at" IS NULL`
      ) as unknown as { file_name: string }[]

      const existingFiles = new Set(existingMedia.map(m => m.file_name))

      // Sync each file
      for (const fileName of fileList) {
        try {
          // Skip if already exists
          if (existingFiles.has(fileName)) {
            skippedCount++
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
          const mimeType = mimeTypeMap[ext] || 'image/jpeg'

          // Generate UUID
          const uuid = generateAid('m')

          // Insert new media record
          await env.DB.execute(
            sql`INSERT INTO "media" (
              "uuid", "file_name", "mime_type", 
              "type", "is_public", "created_at", "updated_at"
            ) VALUES (
              ${uuid}, ${fileName}, ${mimeType},
              'image', 1, ${now}, ${now}
            )`
          )

          syncedCount++
        } catch (error: any) {
          console.error(`Error syncing file ${fileName}:`, error.message)
          // Continue with next file
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        synced: syncedCount,
        skipped: skippedCount,
        total: fileList.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // If no file list, return instructions
    return new Response(JSON.stringify({ 
      success: false,
      message: 'File list is required for sync. In Cloudflare Workers, file system reading is not available.',
      instruction: 'Run the sync script: DATABASE_URL=your_db_url bun run apps/site/scripts/sync-media-db.ts',
      note: 'Or send file list in request body: { files: ["file1.jpg", "file2.png", ...] }'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in sync endpoint:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to process sync request',
      synced: 0
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const POST = withAdminGuard(handlePost)

