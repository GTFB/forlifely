/// <reference types="@cloudflare/workers-types" />

import { getSession } from '../../_shared/session'
import { Env } from '../../_shared/types'
import { MeRepository } from '../../_shared/repositories/me.repository'

/**
 * POST /api/c/installment-application
 * Submit installment application
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
    const body = await request.json() as any
    
    // Validate required fields
    const requiredFields = [
      'firstName',
      'lastName',
      'phoneNumber',
      'permanentAddress',
      'purchasePrice',
      'downPayment',
      'installmentTerm',
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    const meRepository = MeRepository.getInstance(env.DB)
    const userWithRoles = await meRepository.findByIdWithRoles(Number(sessionUser.id))

    if (!userWithRoles) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // TODO: Save application to database
    // TODO: Process files (documentPhotos)
    // TODO: Calculate monthly payment
    // TODO: Send notifications
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Installment application submitted successfully',
        applicationId: `APP-${Date.now()}`,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Submit application error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to submit application', details: String(error) }),
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


