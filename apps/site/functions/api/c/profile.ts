/// <reference types="@cloudflare/workers-types" />

import { getSession } from '../../_shared/session'
import { Env } from '../../_shared/types'
import { MeRepository } from '../../_shared/repositories/me.repository'
import { createDb } from '../../_shared/repositories/utils'
import { schema } from '../../_shared/schema/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/c/profile
 * Returns consumer profile
 */
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context

  if (!env.AUTH_SECRET) {
    return new Response(JSON.stringify({ error: 'Authentication not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sessionUser = await getSession(request, env.AUTH_SECRET)

  if (!sessionUser) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const meRepository = MeRepository.getInstance(env.DB)
    const userWithRoles = await meRepository.findByIdWithRoles(Number(sessionUser.id))

    if (!userWithRoles) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { user, human } = userWithRoles

    return new Response(
      JSON.stringify({
        profile: {
          id: user.id,
          email: user.email,
          name: human?.fullName || user.email,
          phone: human?.phone || null,
          address: human?.address || null,
          kycStatus: human?.kycStatus || 'not_started',
          kycDocuments: human?.dataIn ? JSON.parse(human.dataIn).kycDocuments || [] : [],
          dataIn: human?.dataIn ? JSON.parse(human.dataIn) : null,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Get profile error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get profile', details: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * PUT /api/c/profile
 * Update consumer profile
 */
export const onRequestPut = async (context: { request: Request; env: Env }) => {
  const { request, env } = context

  if (!env.AUTH_SECRET) {
    return new Response(JSON.stringify({ error: 'Authentication not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sessionUser = await getSession(request, env.AUTH_SECRET)

  if (!sessionUser) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const { name, phone, address } = body

    const meRepository = MeRepository.getInstance(env.DB)
    const userWithRoles = await meRepository.findByIdWithRoles(Number(sessionUser.id))

    if (!userWithRoles || !userWithRoles.human) {
      return new Response(JSON.stringify({ error: 'User or human profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const db = createDb(env.DB)
    
    // Update human profile
    const updateData: any = {}
    if (name !== undefined) updateData.fullName = name
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address

    await db
      .update(schema.humans)
      .set(updateData)
      .where(eq(schema.humans.haid, userWithRoles.human.haid))

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Profile updated',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Update profile error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update profile', details: String(error) }),
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
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })


