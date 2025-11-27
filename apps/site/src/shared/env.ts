import { createDb } from './repositories/utils'
import { Env } from './types'

export const buildRequestEnv = (): Env => {
  // In Cloudflare Next-on-Pages, you usually get env from getRequestContext().env
  // However, since we don't have that dependency explicitly checked/installed here,
  // we will try to access it via global process.env or similar fallback.
  // If using 'nodejs_compat', process.env might contain bindings if configured.
  
  // Try to get it from the global scope if it exists (Cloudflare Workers often put bindings on globalThis)
  // @ts-ignore
  const globalEnv: any = typeof globalThis !== 'undefined' ? globalThis : {}

  globalEnv.DB =  createDb()
  
  return Object.assign({}, process.env, globalEnv) as unknown as Env
}

