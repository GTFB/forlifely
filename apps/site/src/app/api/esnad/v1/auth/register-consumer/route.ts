/// <reference types="@cloudflare/workers-types" />

import { UsersRepository } from '@/shared/repositories/users.repository'
import { HumanRepository } from '@/shared/repositories/human.repository'
import { UserRolesRepository } from '@/shared/repositories/user-roles.repository'
import { preparePassword, validatePassword, validatePasswordMatch } from '@/shared/password'
import type { RequestContext } from '@/shared/types'
import type { EsnadUser } from '@/shared/types/esnad'
import { sendVerificationEmail } from '@/shared/services/email-verification.service'
import { logUserJournalEvent } from '@/shared/services/user-journal.service'
import { buildRequestEnv } from '@/shared/env'

type RegisterConsumerRequest = {
  email: string
  password: string
  confirmPassword: string
  fullName?: string
  phone?: string
}

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
} as const

const jsonHeaders = {
  ...corsHeaders,
  'content-type': 'application/json',
} as const

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const onRequestPost = async (context: RequestContext): Promise<Response> => {
  const { request, env } = context

  try {
    const body = (await request.json()) as RegisterConsumerRequest
    const { email, password, confirmPassword, fullName, phone } = body

    if (!email || !password || !confirmPassword) {
      return new Response(
        JSON.stringify({ error: 'Email, password and confirmPassword are required' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    if (!EMAIL_REGEX.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ error: passwordValidation.error }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const matchValidation = validatePasswordMatch(password, confirmPassword)
    if (!matchValidation.valid) {
      return new Response(
        JSON.stringify({ error: matchValidation.error }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const usersRepository = UsersRepository.getInstance()
    const existingUser = await usersRepository.findByEmail(email)

    // Check if user exists and email is verified
    if (existingUser && existingUser.emailVerifiedAt) {
      return new Response(
        JSON.stringify({ error: 'Пользователь с таким email уже существует' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const { hashedPassword, salt } = await preparePassword(password)

    const humanRepository = HumanRepository.getInstance()
    const human = await humanRepository.generateClientByEmail(email, {
      fullName: fullName || email,
      type: 'CLIENT',
      statusName: 'PENDING',
      dataIn: {
        phone,
      },
    })

    let createdUser: EsnadUser

    // If user exists but email is not verified, update existing user
    if (existingUser && !existingUser.emailVerifiedAt) {
      // Update existing user with new password and data
      createdUser = await usersRepository.update(existingUser.uuid, {
        passwordHash: hashedPassword,
        salt,
        isActive: true,
        emailVerifiedAt: null, // Reset verification status
      })
    } else {
      // Create new user
      createdUser = await usersRepository.create({
        humanAid: human.haid,
        email,
        passwordHash: hashedPassword,
        salt,
        isActive: true,
      })
    }

    // Привязываем роль "client" к пользователю по имени
    try {
      const userRolesRepository = UserRolesRepository.getInstance()
      await userRolesRepository.assignRolesToUserByNames(createdUser.uuid, ['client'])
    } catch (error) {
      console.error('Failed to assign client role to new consumer', error)
    }

    try {
      await sendVerificationEmail(env, createdUser, { request, force: true })
    } catch (verificationError) {
      console.error('Failed to send verification email', verificationError)
    }

    try {
      await logUserJournalEvent(env, 'USER_JOURNAL_REGISTRATION', createdUser)
    } catch (journalError) {
      console.error('Failed to log user registration', journalError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        verificationRequired: true,
        message: 'Аккаунт создан. Пожалуйста, подтвердите ваш email адрес перед входом в систему.',
      }),
      { status: 201, headers: jsonHeaders },
    )
  } catch (error) {
    console.error('Failed to register consumer', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'

    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message,
      }),
      { status: 500, headers: jsonHeaders },
    )
  }
}

export const onRequestOptions = async () =>
  new Response(null, {
    status: 204,
    headers: corsHeaders,
  })

export async function POST(request: Request) {
  const env = buildRequestEnv()
  return onRequestPost({ request, env })
}

export async function OPTIONS() {
  return onRequestOptions()
}


