/// <reference types="@cloudflare/workers-types" />

import { AuthenticatedContext } from '@/shared/types'
import { withAdminGuard } from '@/shared/api-guard'
import { seedMedia } from '@/shared/seeds/media'

async function handlePost(context: AuthenticatedContext): Promise<Response> {
  const { env } = context

  try {
    // Try to import and use seedMedia function
    // This will only work in Node.js environment, not in Cloudflare Workers
    try {
      const result = await seedMedia(env.DB)
      
      return new Response(JSON.stringify({ 
        success: true,
        ...result,
        message: 'Media files synced successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (fsError: any) {
      // If file system access is not available (Cloudflare Workers)
      if (fsError.code === 'ENOENT' || fsError.message?.includes('scandir') || fsError.message?.includes('filesystem')) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'File system access not available in Cloudflare Workers environment',
          instruction: 'Run the sync script instead: DATABASE_URL=your_db_url bun run apps/site/scripts/sync-media-db.ts',
          note: 'This endpoint requires Node.js environment with file system access'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      throw fsError
    }
  } catch (error: any) {
    console.error('Error syncing media files:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to sync media files',
      details: error.message,
      instruction: 'Run the sync script instead: DATABASE_URL=your_db_url bun run apps/site/scripts/sync-media-db.ts'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const POST = withAdminGuard(handlePost)

