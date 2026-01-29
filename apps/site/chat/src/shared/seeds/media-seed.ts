import { generateAid } from '../generate-aid'
import type { SeedDefinition, SeedData } from './index'

/**
 * Media seed - syncs files from public/images directory to media table
 * Note: This seed requires file system access, so it works best when called from Node.js environment
 * For Cloudflare Workers, use the sync script: bun run apps/site/scripts/sync-media-db.ts
 */
function generateMediaSeedData(): SeedData {
  return {
    __meta__: {
      name: 'Media Files Sync',
      versions: [
        {
          version: '1.0.0',
          description: 'Sync image files from public/images directory to media table',
          created_at: new Date().toISOString(),
        },
      ],
    },
    // Media seed doesn't provide static data
    // Instead, it should be synced via script or special endpoint
    // This seed is a placeholder that indicates media sync is available
    media: [],
  }
}

export const mediaSeed: SeedDefinition = {
  id: 'media',
  meta: generateMediaSeedData().__meta__,
  getData: () => generateMediaSeedData(),
}

