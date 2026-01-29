import { createSession, jsonWithSession } from '@/shared/session'
import { verifyPassword } from '@/shared/password'
import { Env } from '@/shared/types'
import { MeRepository } from '@/shared/repositories/me.repository'
import { buildRequestEnv } from '@/shared/env'

interface LoginRequest {
  email: string
  password: string
}

/**
 * POST /api/auth/login
 * Authenticates user and creates encrypted session cookie
 */
export async function POST(request: Request) {
  const env = buildRequestEnv()

  if (!env.AUTH_SECRET) {
    return new Response(JSON.stringify({ error: 'Authentication not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!env.DB) {
        return new Response(JSON.stringify({ error: 'Database not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
    }

    // Initialize repository
    const meRepository = MeRepository.getInstance(env.DB)

    // Query user from database with roles
    const userWithRoles = await meRepository.findByEmailWithRoles(email)

    if (!userWithRoles) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { user, roles, human } = userWithRoles

    // Verify password
    const isValidPassword = await verifyPassword(user.salt, password, user.passwordHash)
    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Determine if user is admin (has any system role)
    const isAdmin = roles.some((role) => role.isSystem === true)

    // Create session
    const sessionCookie = await createSession(
      {
        id: String(user.id),
        email: user.email,
        name: human?.fullName || email,
        role: isAdmin ? 'admin' : 'user',
      },
      env.AUTH_SECRET
    )

    return jsonWithSession(
      {
        success: true,
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          name: human?.fullName || email,
          role: isAdmin ? 'admin' : 'user',
          roles: roles.map((role) => ({
            uuid: role.uuid,
            raid: role.raid,
            title: role.title,
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
            dataIn: role.dataIn,
          })),
        },
      },
      sessionCookie
    )
  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ error: 'Login failed', details: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}

