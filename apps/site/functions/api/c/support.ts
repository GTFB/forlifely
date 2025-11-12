/// <reference types="@cloudflare/workers-types" />

import { getSession } from '../../_shared/session'
import { Env } from '../../_shared/types'
import { MeRepository } from '../../_shared/repositories/me.repository'
import { createDb } from '../../_shared/repositories/utils'
import { schema } from '../../_shared/schema/schema'
import { eq, and, desc, isNull } from 'drizzle-orm'

/**
 * GET /api/c/support
 * Returns support tickets for consumer
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

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // TODO: Get tickets from database or from user's dataIn
    // For now, return empty array
    
    return new Response(
      JSON.stringify({
        tickets: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Get support tickets error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get support tickets', details: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * POST /api/c/support
 * Create new support ticket
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
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
    const { subject, message } = await request.json() as {
      subject: string,
      message:string,
    }

    if (!subject || !message) {
      return new Response(JSON.stringify({ error: 'Subject and message are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // TODO: Create ticket in database
    // For now, return success
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Support ticket created',
        ticketId: `TICK-${Date.now()}`,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Create support ticket error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create support ticket', details: String(error) }),
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  })


