/// <reference types="@cloudflare/workers-types" />

import { createSession, jsonWithSession } from '@/shared/session'
import { generateAid } from '@/shared/generate-aid'
import { preparePassword, validatePassword, validatePasswordMatch } from '@/shared/password'
import { buildRequestEnv } from '@/shared/env'
import { sql } from 'drizzle-orm'

interface CreateUserRequest {
  email: string
  name: string
  password: string
  confirmPassword: string
}

/**
 * POST /api/auth/create-first-user
 * Creates the first user in the system
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
    const body: CreateUserRequest = await request.json()
    const { email, name, password, confirmPassword } = body

    // Validate input
    if (!email || !name || !password || !confirmPassword) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate password requirements
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.error }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check password match
    const matchValidation = validatePasswordMatch(password, confirmPassword)
    if (!matchValidation.valid) {
      return new Response(
        JSON.stringify({ error: matchValidation.error }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if this is the first user
    const userCountResult = await env.DB.execute(sql`SELECT COUNT(*) as count FROM users`);
    const userCount = Number(userCountResult[0]?.count || 0);

    if (userCount > 0) {
      return new Response(
        JSON.stringify({ error: 'Users already exist. Please use the login page.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Prepare password (hash and generate salt)
    const { hashedPassword, salt } = await preparePassword(password)

    // Generate UUIDs and AIDs
    const userUuid = crypto.randomUUID()
    const humanUuid = crypto.randomUUID()
    const humanAid = generateAid('h')
    
    // Create Human first
    await env.DB.execute(sql`
      INSERT INTO humans (uuid, haid, full_name, email, created_at, updated_at) 
      VALUES (${humanUuid}, ${humanAid}, ${name}, ${email}, NOW(), NOW())
    `);

    // Check if admin role exists, if not create it
    const adminRoleResult = await env.DB.execute(sql`
      SELECT uuid, raid FROM roles WHERE raid LIKE 'r-%' AND is_system = TRUE LIMIT 1
    `);
    
    let adminRole = adminRoleResult[0] as { uuid: string; raid: string } | undefined;

    if (!adminRole) {
      const roleUuid = crypto.randomUUID()
      const roleAid = generateAid('r')
      
      await env.DB.execute(sql`
        INSERT INTO roles (uuid, raid, name, title, is_system, "order", created_at, updated_at) 
        VALUES (${roleUuid}, ${roleAid}, 'Administrator', 'Administrator', TRUE, 0, NOW(), NOW())
      `);
      
      adminRole = { uuid: roleUuid, raid: roleAid }
    }

    // Insert user into database
    await env.DB.execute(sql`
      INSERT INTO users (uuid, human_aid, email, password_hash, salt, is_active, created_at, updated_at) 
      VALUES (${userUuid}, ${humanAid}, ${email}, ${hashedPassword}, ${salt}, TRUE, NOW(), NOW())
    `);

    // Create user_role relationship
    await env.DB.execute(sql`
      INSERT INTO user_roles (user_uuid, role_uuid, "order", created_at, updated_at) 
      VALUES (${userUuid}, ${adminRole.uuid}, 0, NOW(), NOW())
    `);

    // Get the user ID for session
    const createdUserResult = await env.DB.execute(sql`
      SELECT id FROM users WHERE uuid = ${userUuid} LIMIT 1
    `);
    
    const createdUser = createdUserResult[0] as { id: number };

    if (!createdUser) {
      throw new Error('Failed to retrieve created user')
    }

    // Create session for the new user
    const sessionCookie = await createSession(
      {
        id: Number(createdUser.id),
        email,
        name,
        role: 'admin',
      },
      env.AUTH_SECRET
    )

    return jsonWithSession(
      {
        success: true,
        user: {
          id: createdUser.id,
          uuid: userUuid,
          email,
          name,
          role: 'admin',
        },
      },
      sessionCookie,
      201
    )
  } catch (error) {
    console.error('Create first user error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create user', details: String(error) }),
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
