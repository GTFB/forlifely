import { buildRequestEnv } from '@/shared/env'
import { SettingsRepository } from '@/shared/repositories'

/**
 * GET /api/shipping
 * Returns shipping settings
 */
export async function GET() {
  try {
    const env = buildRequestEnv()
    const settingsRepo = SettingsRepository.getInstance(env.DB)
    
    const settings = await settingsRepo.getShippingSettings()
    
    return new Response(
      JSON.stringify(settings),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error fetching shipping settings:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch shipping settings',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * POST /api/shipping/calculate
 * Calculate shipping cost for a given order total
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderTotal } = body as { orderTotal: number }
    
    if (typeof orderTotal !== 'number' || orderTotal < 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid orderTotal. Must be a non-negative number.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    
    const env = buildRequestEnv()
    const settingsRepo = SettingsRepository.getInstance(env.DB)
    
    const { freeShippingThreshold, shippingCost } = await settingsRepo.getShippingSettings()
    
    const shipping = orderTotal >= freeShippingThreshold ? 0 : shippingCost
    
    return new Response(
      JSON.stringify({ shipping }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error calculating shipping:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to calculate shipping',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

