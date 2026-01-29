/// <reference types="@cloudflare/workers-types" />

import { withAdminGuard } from '@/shared/api-guard'
import { SeedRepository } from '@/shared/repositories/seed.repository'
import { seeds } from '@/shared/seeds'
import { AuthenticatedContext, Env } from '@/shared/types'

type SeedData = {
  [collection: string]: Array<Record<string, unknown> & { uuid: string }>
}

/**
 * GET /api/admin/seed
 * Returns list of all available seed files with metadata
 */
async function handleGet(context: AuthenticatedContext): Promise<Response> {
  try {
    const seedList = seeds.map((seed) => ({
      id: seed.id,
      name: seed.meta.name,
      meta: seed.meta,
    }))

    return new Response(
      JSON.stringify({
        success: true,
        seeds: seedList,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Get seed files error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch seed files',
        details: String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * POST /api/admin/seed
 * Body: { seedId: 'system' } - seeds data from specified seed
 */
async function handlePost(context: AuthenticatedContext): Promise<Response> {
  const { request, env } = context

  try {
    const body = (await request.json().catch(() => ({}))) as {
      seedId?: string
      clear?: boolean | string
    }

    if (!body.seedId) {
      return new Response(
        JSON.stringify({ error: 'seedId is required in request body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Find seed by id
    const seed = seeds.find((s) => s.id === body.seedId)
    if (!seed) {
      return new Response(
        JSON.stringify({
          error: `Seed '${body.seedId}' not found`,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get seed data (generated at runtime)
    const seedDataFull = seed.getData()
    // Extract data without __meta__
    const { __meta__, ...seedData } = seedDataFull
    
    // System seeds should never clear anything
    const isSystemSeed = body.seedId === 'system' || body.seedId === 'shipping-settings'
    
    // Media seed requires special handling - it syncs files from filesystem
    if (body.seedId === 'media') {
      // Try to call sync-files endpoint instead
      // This will work if running in Node.js environment
      try {
        console.log('🔄 Starting media seed...')
        console.log('🔍 process.cwd() in route:', process.cwd())
        
        // Import seedMedia function
        const { seedMedia } = await import('@/shared/seeds/media')
        console.log('✅ seedMedia function imported')
        
        const result = await seedMedia(env.DB)
        console.log('✅ seedMedia completed:', JSON.stringify(result, null, 2))
        
        // If result is all zeros, log warning
        if (result.synced === 0 && result.skipped === 0 && result.total === 0) {
          console.warn('⚠️  WARNING: seedMedia returned all zeros. Check server logs for details.')
        }
        
        return new Response(
          JSON.stringify({
            success: true,
            seedId: body.seedId,
            results: {
              media: {
                inserted: result.synced,
                updated: 0,
                skipped: result.skipped,
                errors: 0,
              }
            },
            message: `Synced ${result.synced} media files, skipped ${result.skipped} existing files`,
            debug: {
              total: result.total,
              synced: result.synced,
              skipped: result.skipped,
            }
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      } catch (error: any) {
        console.error('❌ Media seed error:', error)
        console.error('❌ Error message:', error.message)
        console.error('❌ Error stack:', error.stack)
        // If file system access is not available (Cloudflare Workers)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Media seed requires file system access',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            instruction: 'Run the sync script: DATABASE_URL=your_db_url bun run apps/site/scripts/sync-media-db.ts',
            note: 'Media seed syncs files from public/images directory, which requires Node.js environment (not available in Cloudflare Workers)',
            alternative: 'Or call POST /api/admin/media/sync-files endpoint if running in Node.js environment',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }
    
    // Check if clear flag is set (but ignore for system seeds)
    const clearBeforeSeed = !isSystemSeed && (body.clear === true || body.clear === 'true')
    
    // Use SeedRepository to handle all seeding logic
    const seedRepository = SeedRepository.getInstance(env.DB)
    const results = await seedRepository.seedMultiple(seedData as SeedData, clearBeforeSeed)

    return new Response(
      JSON.stringify({
        success: true,
        seedId: body.seedId,
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Seed data error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to seed data',
        details: String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export const GET = withAdminGuard(handleGet)
export const POST = withAdminGuard(handlePost)

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


