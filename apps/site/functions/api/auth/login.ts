/// <reference types="@cloudflare/workers-types" />

import { createSession, jsonWithSession } from '../../_shared/session'
import { verifyPassword } from '../../_shared/password'
import { Env } from '../../_shared/types'
import { MeRepository } from '../../_shared/repositories/me.repository'
import { UsersRepository } from '../../_shared/repositories/users.repository'
import { getNextResendAvailableAt } from '../../_shared/services/email-verification.service'
import { logUserJournalEvent } from '../../_shared/services/user-journal.service'
interface LoginRequest {
  email: string
  password: string
}

/**
 * POST /api/auth/login
 * Authenticates user and creates encrypted session cookie
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context

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

    // Initialize repository
    const meRepository = MeRepository.getInstance(env.DB)
    const usersRepository = UsersRepository.getInstance(env.DB)

    const persistedUser = await usersRepository.findByEmail(email)
    if (!persistedUser) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Query user from database with roles
    const userWithRoles = await meRepository.findByEmailWithRoles(email)

    if (!userWithRoles) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { roles, human } = userWithRoles

    // Verify password
    const isValidPassword = await verifyPassword(persistedUser.salt, password, persistedUser.passwordHash)
    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!persistedUser.emailVerifiedAt) {
      const resendAvailableAt = getNextResendAvailableAt(persistedUser)
      return new Response(
        JSON.stringify({
          error: 'Email is not verified',
          code: 'EMAIL_NOT_VERIFIED',
          resendAvailableAt,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Determine if user is admin (has any system role)
    const isAdmin = roles.some((role) => role.isSystem === true)

    await usersRepository.update(persistedUser.uuid, {
      lastLoginAt: new Date().toISOString(),
    })

    // Create session
    const sessionCookie = await createSession(
      {
        id: String(persistedUser.id),
        email: persistedUser.email,
        name: human?.fullName || persistedUser.email,
        role: isAdmin ? 'admin' : 'user',
      },
      env.AUTH_SECRET
    )

    try {
      await logUserJournalEvent(env, 'USER_JOURNAL_LOGIN', persistedUser)
    } catch (journalError) {
      console.error('Failed to log user login action', journalError)
    }

    return jsonWithSession(
      {
        success: true,
        user: {
          id: persistedUser.id,
          uuid: persistedUser.uuid,
          email: persistedUser.email,
          name: human?.fullName || persistedUser.email,
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

export const onRequestOptions = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })

