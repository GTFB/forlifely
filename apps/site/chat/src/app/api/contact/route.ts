/// <reference types="@cloudflare/workers-types" />

import { buildRequestEnv } from '@/shared/env'
import { generateAid } from '@/shared/generate-aid'
import { sql } from 'drizzle-orm'

interface ContactFormRequest {
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
}

/**
 * POST /api/contact
 * Saves contact form submission to goals table
 */
export async function POST(request: Request) {
  const env = buildRequestEnv()

  try {
    const body: ContactFormRequest = await request.json()
    const { firstName, lastName, email, phone, message } = body

    // Validation
    if (!firstName || !lastName || !email || !phone || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: firstName, lastName, email, phone, message' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Create goal (contact form submission)
    const goalUuid = crypto.randomUUID()
    const gaid = generateAid('g')
    const fullName = `${firstName} ${lastName}`
    const goalTitle = `Контактная форма: ${fullName}`
    
    const goalDataIn = JSON.stringify({
      firstName,
      lastName,
      fullName,
      email,
      phone,
      message,
      source: 'contact_form',
    })

    const result = await env.DB.execute(sql`
      INSERT INTO goals (
        uuid, gaid, title, type, status_name, is_public, data_in,
        created_at, updated_at
      )
      VALUES (
        ${goalUuid}, 
        ${gaid}, 
        ${goalTitle}, 
        'contact_form', 
        'new', 
        TRUE, 
        ${goalDataIn},
        NOW(),
        NOW()
      ) RETURNING id
    `);

    const insertedId = result[0]?.id;

    return new Response(
      JSON.stringify({
        success: true,
        goalId: insertedId,
        goalUuid,
        gaid,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error saving contact form:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to save contact form',
        details: error instanceof Error ? error.message : String(error),
      }),
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
    },
  })
}
