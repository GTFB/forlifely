/// <reference types="@cloudflare/workers-types" />

import { getSession } from '@/shared/session'
import { Env } from '@/shared/types'
import { MeRepository } from '@/shared/repositories/me.repository'
import { db } from '@/shared/db'
import { schema } from '@/shared/schema/schema'
import { eq } from 'drizzle-orm'

type HumanData = {
  phone?: string | null
  address?: string | null
  kycStatus?: string | null
  kycDocuments?: unknown[]
  [key: string]: unknown
}

const parseHumanData = (data: unknown): HumanData => {
  if (!data) return {}
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return typeof parsed === 'object' && parsed !== null ? (parsed as HumanData) : {}
    } catch {
      return {}
    }
  }
  if (typeof data === 'object') {
    return data as HumanData
  }
  return {}
}

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
    const meRepository = MeRepository.getInstance()
    const userWithRoles = await meRepository.findByIdWithRoles(Number(sessionUser.id))

    if (!userWithRoles) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { user, human } = userWithRoles
    const humanData = parseHumanData(human?.dataIn)
    const kycDocuments = Array.isArray(humanData.kycDocuments) ? humanData.kycDocuments : []

    return new Response(
      JSON.stringify({
        profile: {
          id: user.id,
          email: user.email,
          name: human?.fullName || user.email,
          phone: (humanData.phone ?? null) as string | null,
          address: (humanData.address ?? null) as string | null,
          kycStatus: (humanData.kycStatus as string | null) ?? 'not_started',
          kycDocuments,
          dataIn: Object.keys(humanData).length ? humanData : null,
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
    const body = (await request.json()) as {
      name?: string
      phone?: string | null
      address?: string | null
    }
    const { name, phone, address } = body

    const meRepository = MeRepository.getInstance()
    const userWithRoles = await meRepository.findByIdWithRoles(Number(sessionUser.id))

    if (!userWithRoles || !userWithRoles.human) {
      return new Response(JSON.stringify({ error: 'User or human profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    // Update human profile
    const humanData = parseHumanData(userWithRoles.human.dataIn)
    const updatedDataIn: HumanData = { ...humanData }
    const updateColumns: Record<string, unknown> = {}

    if (name !== undefined) {
      updateColumns.fullName = name
    }
    if (phone !== undefined) {
      updatedDataIn.phone = phone
    }
    if (address !== undefined) {
      updatedDataIn.address = address
    }
    if (phone !== undefined || address !== undefined) {
      updateColumns.dataIn = JSON.stringify(updatedDataIn)
    }

    if (Object.keys(updateColumns).length) {
      await db
        .update(schema.humans)
        .set(updateColumns)
        .where(eq(schema.humans.haid, userWithRoles.human.haid))
    }

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


