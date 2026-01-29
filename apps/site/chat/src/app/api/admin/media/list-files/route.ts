/// <reference types="@cloudflare/workers-types" />

import { AuthenticatedContext } from '@/shared/types'
import { withAdminGuard } from '@/shared/api-guard'

async function handleGet(context: AuthenticatedContext): Promise<Response> {
  // In Cloudflare Workers, we can't read filesystem
  // This endpoint returns instructions for syncing
  // The actual file listing should be done via a Node.js script
  
  return new Response(JSON.stringify({ 
    files: [],
    message: 'File listing is not available in Cloudflare Workers environment.',
    instruction: 'Run the sync script: bun run apps/site/scripts/sync-media-db.ts',
    note: 'Or manually provide file list to /api/admin/media/sync endpoint'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const GET = withAdminGuard(handleGet)

