
import { buildRequestEnv } from '@/shared/env'
import { getSession, isAdmin } from '@/shared/session'
import { MeRepository } from '@/shared/repositories/me.repository'
import type { AuthenticatedContext, Context, Env, RequestContext } from '@/shared/types'

export type AuthenticatedRequestContext = Context & {
  user: NonNullable<Awaited<ReturnType<MeRepository['findByIdWithRoles']>>>
}

type RouteHandler<T extends Context = Context> = (context: T) => Promise<Response>

export function withRoleGuard<T extends Context>(handler: RouteHandler<T>, checkRole: (user: any) => boolean) {
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

    const sessionUser = await getSession(request, env.AUTH_SECRET)
    if (!sessionUser?.id) {
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

    // Ensure DB is available
    if (!env.DB) {
         return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'INTERNAL_SERVER_ERROR', 
          message: 'Database not configured' 
        }),
        { 
          status: 500, 
          headers: { 'content-type': 'application/json' } 
        }
      )
    }

    const meRepo = MeRepository.getInstance()
    const user = await meRepo.findByIdWithRoles(Number(sessionUser.id))
    
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

    // Check if user is active
    if (!user.user.isActive || user.user.deletedAt) {
      return new Response(JSON.stringify({ error: 'User account inactive or deleted' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if user has allowed role using the checkRole callback
    if (!checkRole(user)) {
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

export function withAdminGuard<T extends Context>(handler: RouteHandler<T>) {
  return withRoleGuard(handler, (user) => isAdmin(user))
}
export function withSuperAdminGuard<T extends Context>(handler: RouteHandler<T>) {
  return withAllowedRoleGuard(handler,['Administrator'])
}
export function withClientGuard<T extends Context>(handler: RouteHandler<T>) {
  return withAllowedRoleGuard(handler,['client'])
}

export function withInvestorGuard<T extends Context>(handler: RouteHandler<T>) {
  return withAllowedRoleGuard(handler,['investor'])
}

export function withManagerGuard<T extends Context>(handler: RouteHandler<T>) {
  return withRoleGuard(handler, (userWithRoles: any) => {
    // Logic from original middleware
    const { roles } = userWithRoles
    const isSystemAdmin = roles.some((role: any) => role.name === 'Administrator' )
    const allowedRoleNames = ['Administrator', 'manager']
    const allowedRaids = ['Administrator', 'r-manag1']
    const userRoleNames = roles.map((r: any) => r.name).filter(Boolean)
    const userRaids = roles.map((r: any) => r.raid).filter(Boolean)
    const hasRoleAccess = userRoleNames.some((name: string) => allowedRoleNames.includes(name)) ||
                         userRaids.some((raid: string) => allowedRaids.includes(raid))

    return isSystemAdmin || hasRoleAccess
  })
}

export function withStorekeeperGuard<T extends Context>(handler: RouteHandler<T>) {
  return withRoleGuard(handler, (userWithRoles: any) => {
    const { roles } = userWithRoles
    const isSystemAdmin = roles.some((role: any) => role.name === 'Administrator')
    const allowedRoleNames = ['Administrator', 'storekeeper']
    const allowedRaids = ['Administrator', 'r-store1']
    const userRoleNames = roles.map((r: any) => r.name).filter(Boolean)
    const userRaids = roles.map((r: any) => r.raid).filter(Boolean)
    const hasRoleAccess = userRoleNames.some((name: string) => allowedRoleNames.includes(name)) ||
                         userRaids.some((raid: string) => allowedRaids.includes(raid))

    return isSystemAdmin || hasRoleAccess
  })
}

export function withEditorGuard<T extends Context>(handler: RouteHandler<T>) {
  return withRoleGuard(handler, (userWithRoles: any) => {
    const { roles } = userWithRoles
    const isSystemAdmin = roles.some((role: any) => role.isSystem === true)
    // Allow both Administrator and Editor roles (check both name and raid)
    const allowedRoleNames = ['Administrator', 'administrator', 'Editor', 'editor']
    const allowedRaids = ['Administrator', 'editor', 'r-edito1']
    const userRoleNames = roles.map((r: any) => r.name).filter(Boolean)
    const userRaids = roles.map((r: any) => r.raid).filter(Boolean)
    const hasRoleAccess = userRoleNames.some((name: string) => allowedRoleNames.includes(name)) ||
                         userRaids.some((raid: string) => allowedRaids.includes(raid))

    console.log('[withEditorGuard] Checking access:', {
      isSystemAdmin,
      userRoleNames,
      userRaids,
      hasRoleAccess,
      allowedRoleNames,
      allowedRaids
    })

    return isSystemAdmin || hasRoleAccess
  })
}

export function withAllowedRoleGuard<T extends RequestContext>(handler: RouteHandler<T>, allowedRoles: string[]) {
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