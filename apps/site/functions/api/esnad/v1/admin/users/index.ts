/// <reference types="@cloudflare/workers-types" />

import { UsersRepository } from '@/shared/repositories/users.repository'
import { MeRepository } from '@/shared/repositories/me.repository'
import { HumanRepository } from '@/shared/repositories/human.repository'
import { Env } from '@/shared/types'
import { parseQueryParams } from '@/shared/utils/http'
import { RequestContext } from '@/shared/types'
import type { EsnadUser } from '@/shared/types/esnad'
import { getSession } from '@/shared/session'
import { preparePassword, validatePassword, validatePasswordMatch } from '@/shared/password'
import { generateAid } from '@/shared/generate-aid'

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
} as const

const jsonHeaders = {
  ...corsHeaders,
  'content-type': 'application/json',
} as const

const ADMIN_ROLE_NAMES = ['Administrator', 'admin']

interface CreateUserRequest {
  email: string
  password: string
  confirmPassword: string
  fullName?: string
  roleUuids?: string[]
}

interface UserWithRoles extends EsnadUser {
  roles?: Array<{
    uuid: string
    raid: string | null
    title: string | null
    name: string | null
    description: string | null
    isSystem: boolean | null
  }>
}

export const onRequestGet = async (context: RequestContext): Promise<Response> => {
  const { request, env } = context

  try {
    const url = new URL(request.url)
    const { filters, orders, pagination } = parseQueryParams(url)

    const usersRepository = UsersRepository.getInstance(env.DB)
    const result = await usersRepository.getFiltered(filters, orders, pagination)

    // Load roles for each user
    const meRepository = MeRepository.getInstance(env.DB as D1Database)
    const usersWithRoles: UserWithRoles[] = await Promise.all(
      result.docs.map(async (user) => {
        try {
          const userWithRoles = await meRepository.findByIdWithRoles(Number(user.id))
          return {
            ...user,
            roles: userWithRoles?.roles?.map((role) => ({
              uuid: role.uuid,
              raid: role.raid ?? null,
              title: role.title ?? null,
              name: role.name ?? null,
              description: role.description ?? null,
              isSystem: role.isSystem ?? null,
            })) || [],
          }
        } catch (err) {
          console.error(`Failed to load roles for user ${user.uuid}:`, err)
          return {
            ...user,
            roles: [],
          }
        }
      })
    )

    return new Response(
      JSON.stringify({
        docs: usersWithRoles,
        pagination: result.pagination,
      }),
      {
        status: 200,
        headers: jsonHeaders,
      },
    )
  } catch (error) {
    console.error('Failed to fetch users', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'

    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message,
      }),
      {
        status: 500,
        headers: jsonHeaders,
      },
    )
  }
}

export const onRequestPost = async (context: RequestContext): Promise<Response> => {
  const { request, env } = context

  try {
    if (!env.AUTH_SECRET) {
      return new Response(JSON.stringify({ error: 'Authentication not configured' }), {
        status: 500,
        headers: jsonHeaders,
      })
    }

    // Get current user from session
    const sessionUser = await getSession(request, env.AUTH_SECRET)
    if (!sessionUser) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: jsonHeaders,
      })
    }

    // Get current user roles to check permissions
    const meRepository = MeRepository.getInstance(env.DB as D1Database)
    const currentUserWithRoles = await meRepository.findByIdWithRoles(Number(sessionUser.id))
    
    if (!currentUserWithRoles) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: jsonHeaders,
      })
    }

    // Check if current user is admin (has system role)
    const isAdmin = currentUserWithRoles.roles.some((role) => role.isSystem === true)
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: jsonHeaders,
      })
    }

    // Check if current user is super administrator
    const isSuperAdmin = currentUserWithRoles.roles.some(
      (role) => role.name === 'Administrator'
    )

    const body = await request.json() as CreateUserRequest
    const { email, password, confirmPassword, fullName, roleUuids } = body

    // Validate input
    if (!email || !password || !confirmPassword) {
      return new Response(
        JSON.stringify({ error: 'Email, password and confirmPassword are required' }),
        {
          status: 400,
          headers: jsonHeaders,
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: jsonHeaders,
        }
      )
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.error }),
        {
          status: 400,
          headers: jsonHeaders,
        }
      )
    }

    // Validate password match
    const matchValidation = validatePasswordMatch(password, confirmPassword)
    if (!matchValidation.valid) {
      return new Response(
        JSON.stringify({ error: matchValidation.error }),
        {
          status: 400,
          headers: jsonHeaders,
        }
      )
    }

    // Check if user with this email already exists
    const existingUser = await env.DB.prepare(
      'SELECT uuid FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1'
    )
      .bind(email)
      .first<{ uuid: string }>()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        {
          status: 400,
          headers: jsonHeaders,
        }
      )
    }

    // Validate roles if provided
    if (roleUuids && Array.isArray(roleUuids) && roleUuids.length > 0) {
      // Get all role UUIDs to validate
      const roles = await env.DB.prepare(
        'SELECT uuid, name FROM roles WHERE uuid IN (' + roleUuids.map(() => '?').join(',') + ') AND deleted_at IS NULL'
      )
        .bind(...roleUuids)
        .all<{ uuid: string; name: string | null }>()

      // Check if all provided roles exist
      if (roles.results.length !== roleUuids.length) {
        return new Response(
          JSON.stringify({ error: 'One or more roles not found' }),
          {
            status: 400,
            headers: jsonHeaders,
          }
        )
      }

      // If not super admin, check that no admin roles are being assigned
      if (!isSuperAdmin) {
        const adminRoles = roles.results.filter((role) =>
          ADMIN_ROLE_NAMES.includes(role.name || '')
        )
        if (adminRoles.length > 0) {
          return new Response(
            JSON.stringify({ error: 'You cannot assign administrator roles' }),
            {
              status: 403,
              headers: jsonHeaders,
            }
          )
        }
      }
    }

    // Prepare password
    const { hashedPassword, salt } = await preparePassword(password)

    // Create Human first (using repository)
    const humanRepository = HumanRepository.getInstance(env.DB as D1Database)
    const human = await humanRepository.generateClientByEmail(email, {
      fullName: fullName || email,
      type: 'CLIENT',
      statusName: 'PENDING',
    })

    // Create user using repository
    const usersRepository = UsersRepository.getInstance(env.DB)
    const createdUser = await usersRepository.create({
      humanAid: human.haid,
      email,
      passwordHash: hashedPassword,
      salt,
      isActive: true,
    })

    // Assign roles if provided
    if (roleUuids && Array.isArray(roleUuids) && roleUuids.length > 0) {
      for (let i = 0; i < roleUuids.length; i++) {
        await env.DB.prepare(
          `INSERT INTO user_roles (user_uuid, role_uuid, "order", created_at) 
           VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
        )
          .bind(createdUser.uuid, roleUuids[i], i)
          .run()
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: createdUser,
      }),
      {
        status: 201,
        headers: jsonHeaders,
      }
    )
  } catch (error) {
    console.error('Failed to create user', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'

    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message,
      }),
      {
        status: 500,
        headers: jsonHeaders,
      },
    )
  }
}

export const onRequestOptions = async (): Promise<Response> =>
  new Response(null, {
    status: 204,
    headers: corsHeaders,
  })

