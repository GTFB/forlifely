/// <reference types="@cloudflare/workers-types" />

import { AuthenticatedContext } from '@/shared/types'
import { withAdminGuard, withEditorGuard } from '@/shared/api-guard'
import { sql } from 'drizzle-orm'

async function handleGet(context: AuthenticatedContext): Promise<Response> {
  const { env } = context

  try {
    // Get all media from database, excluding deleted items
    const mediaResult = await env.DB.execute(
      sql`SELECT * FROM "media" WHERE "deleted_at" IS NULL ORDER BY "created_at" DESC`
    ) as unknown as any[]

    console.log(`Found ${mediaResult.length} media records in database`)

    // Transform media items to match frontend interface
    const transformedMedia = mediaResult.map((item) => {
      // Get filename from file_name or filename field
      const fileName = item.file_name || item.filename || ''
      // Build URL - images are stored in /images/ folder
      const url = fileName ? `/images/${fileName}` : (item.url || '')
      
      // Parse title if it's JSON
      let title = item.title || ''
      if (typeof title === 'string' && (title.startsWith('{') || title.startsWith('"'))) {
        try {
          const parsed = JSON.parse(title)
          title = typeof parsed === 'object' ? (parsed.ru || parsed.en || '') : String(parsed)
        } catch {
          // Keep as is if not valid JSON
        }
      }

      // Use filename as slug for matching
      const slug = fileName || item.uuid || ''
      const id = fileName || item.uuid || ''

      return {
        id: id,
        slug: slug,
        url: url,
        alt: item.alt_text || title || '',
        title: title || fileName || '',
        description: item.caption || '',
        filename: fileName,
        type: item.type || (fileName ? 'image' : 'document'),
        size: item.size_bytes || item.filesize || 0,
        mimeType: item.mime_type || '',
        createdAt: item.created_at || new Date().toISOString()
      }
    })

    return new Response(JSON.stringify({ 
      media: transformedMedia,
      total: transformedMedia.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error fetching media:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch media',
      media: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Allow both Admin and Editor roles for media access
export const GET = withEditorGuard(handleGet)

