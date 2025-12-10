
import { buildRequestEnv } from '@/shared/env'
import { getSession } from '@/shared/session'
import { MeRepository } from '@/shared/repositories/me.repository'
import type { RequestContext, Env } from '@/shared/types'

export type AuthenticatedRequestContext = RequestContext & {
  user: NonNullable<Awaited<ReturnType<MeRepository['findByIdWithRoles']>>>
}

type RouteHandler<T extends RequestContext = RequestContext> = (context: T) => Promise<Response>

export function withRoleGuard<T extends RequestContext>(handler: RouteHandler<T>, allowedRoles: string[]) {
  return async (request: Request, props?: { params?: Promise<Record<string, string>> }) => {
    const env = buildRequestEnv()
    
    // Check auth secret
    if (!env.AUTH_SECRET) {
      console.error('AUTH_SECRET not configured')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'INTERNAL_SERVER_ERROR', 
          message: 'Authentication not configured' 
        }),
        { 
          status: 500, 
          headers: { 'content-type': 'application/json' } 
        }
      )
    }

    const session = await getSession(request, env.AUTH_SECRET)
    if (!session?.id) {
       return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'UNAUTHORIZED', 
          message: 'Unauthorized' 
        }),
        { 
          status: 401, 
          headers: { 'content-type': 'application/json' } 
        }
      )
    }

    const meRepo = MeRepository.getInstance()
    const user = await meRepo.findByIdWithRoles(Number(session.id))
    
    if (!user) {
       return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'UNAUTHORIZED', 
          message: 'User not found' 
        }),
        { 
          status: 401, 
          headers: { 'content-type': 'application/json' } 
        }
      )
    }

    // Check if user has any of the allowed roles
    const hasAllowedRole = user.roles.some(r => r.name && allowedRoles.includes(r.name))
    
    if (!hasAllowedRole) {
       return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'FORBIDDEN', 
          message: 'Forbidden: Insufficient permissions' 
        }),
        { 
          status: 403, 
          headers: { 'content-type': 'application/json' } 
        }
      )
    }

    const resolvedParams = props?.params ? await props.params : undefined
    
    const context = {
        request,
        env,
        params: resolvedParams,
        user
    } as unknown as T

    return handler(context)
  }
}

export function withAdminGuard<T extends RequestContext>(handler: RouteHandler<T>) {
  return withRoleGuard(handler, ['Administrator', 'admin'])
}

export function withSuperAdminGuard<T extends RequestContext>(handler: RouteHandler<T>) {
  return withRoleGuard(handler, ['Administrator'])
}

export function withConsumerGuard<T extends RequestContext>(handler: RouteHandler<T>) {
  return withRoleGuard(handler, [ 'client'])
}
export function withClientGuard<T extends RequestContext>(handler: RouteHandler<T>) {
  return withRoleGuard(handler, [ 'client'])
}

export function withInvestorGuard<T extends RequestContext>(handler: RouteHandler<T>) {
  return withRoleGuard(handler, ['investor'])
}

/**
 * Guard для доступа всем аутентифицированным пользователям кроме админа
 * Используется для эндпоинтов, которые должны быть доступны клиентам и инвесторам, но не админам
 */
export function withNonAdminGuard<T extends RequestContext>(handler: RouteHandler<T>) {
  return async (request: Request, props?: { params?: Promise<Record<string, string>> }) => {
    const env = buildRequestEnv()
    
    // Check auth secret
    if (!env.AUTH_SECRET) {
      console.error('AUTH_SECRET not configured')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'INTERNAL_SERVER_ERROR', 
          message: 'Authentication not configured' 
        }),
        { 
          status: 500, 
          headers: { 'content-type': 'application/json' } 
        }
      )
    }

    const session = await getSession(request, env.AUTH_SECRET)
    if (!session?.id) {
       return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'UNAUTHORIZED', 
          message: 'Unauthorized' 
        }),
        { 
          status: 401, 
          headers: { 'content-type': 'application/json' } 
        }
      )
    }

    const meRepo = MeRepository.getInstance()
    const user = await meRepo.findByIdWithRoles(Number(session.id))
    
    if (!user) {
       return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'UNAUTHORIZED', 
          message: 'User not found' 
        }),
        { 
          status: 401, 
          headers: { 'content-type': 'application/json' } 
        }
      )
    }

  

    const resolvedParams = props?.params ? await props.params : undefined
    
    const context = {
        request,
        env,
        params: resolvedParams,
        user
    } as unknown as T

    return handler(context)
  }
}
