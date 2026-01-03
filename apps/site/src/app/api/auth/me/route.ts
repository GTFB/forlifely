import { NextRequest, NextResponse } from 'next/server'

import { getSession } from '@/shared/session'
import { MeRepository } from '@/shared/repositories/me.repository'
import { UserSessionsRepository } from '@/shared/repositories/user-sessions.repository'
import { clearSession, isSecureRequest } from '@/shared/session'

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
} as const

export async function GET(request: NextRequest) {
  const authSecret = process.env.AUTH_SECRET

  if (!authSecret) {
    return NextResponse.json(
      { error: 'Authentication not configured' },
      { status: 500, headers: JSON_HEADERS }
    )
  }

  const sessionUser = await getSession(request, authSecret)

  if (!sessionUser) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401, headers: JSON_HEADERS }
    )
  }

  if (sessionUser.sessionUuid) {
    try {
      const repo = UserSessionsRepository.getInstance()
      const active = await repo.ensureActiveSession({
        sessionUuid: sessionUser.sessionUuid,
        userId: Number(sessionUser.id),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      })
      if (!active) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          {
            status: 401,
            headers: {
              ...JSON_HEADERS,
              'Set-Cookie': clearSession({
                secure: isSecureRequest(request),
                sameSite: 'Lax',
              }),
            },
          }
        )
      }
    } catch (e) {
      console.error('Failed to validate sessionUuid:', e)
    }
  }

  try {
    const meRepository = MeRepository.getInstance()
    const userWithRoles = await meRepository.findByIdWithRoles(Number(sessionUser.id))

    if (!userWithRoles) {
      return NextResponse.json({ error: 'User not found' }, { status: 401, headers: JSON_HEADERS })
    }

    const { user: dbUser, roles, human } = userWithRoles

    if (dbUser.deletedAt) {
      return NextResponse.json(
        { error: 'User account deleted' },
        { status: 403, headers: JSON_HEADERS }
      )
    }

    if (!dbUser.isActive) {
      return NextResponse.json(
        { error: 'User account inactive' },
        { status: 403, headers: JSON_HEADERS }
      )
    }

    // Extract phone + avatar from human.dataIn if available
    let phone: string | undefined
    let avatarMediaUuid: string | undefined
    if (human?.dataIn) {
      try {
        const dataIn = typeof human.dataIn === 'string' ? JSON.parse(human.dataIn) : human.dataIn
        phone = dataIn?.phone || undefined
        avatarMediaUuid = dataIn?.avatarMedia?.uuid || undefined
      } catch {
        // If parsing fails, try to access as object directly
        phone = (human.dataIn as any)?.phone || undefined
        avatarMediaUuid = (human.dataIn as any)?.avatarMedia?.uuid || undefined
      }
    }

    const user = {
      id: String(dbUser.id),
      uuid: dbUser.uuid,
      email: dbUser.email,
      name: human?.fullName || dbUser.email,
      phone,
      avatarMediaUuid: avatarMediaUuid || null,
      avatarUrl: avatarMediaUuid ? `/api/esnad/v1/media/${avatarMediaUuid}` : null,
      humanAid: dbUser.humanAid || null,
      roles: roles.map((role) => ({
        uuid: role.uuid,
        raid: role.raid,
        title: role.title,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        dataIn: role.dataIn,
      })),
    }

    return NextResponse.json({ user }, { status: 200, headers: JSON_HEADERS })
  } catch (error) {
    console.error('Get user data error:', error)
    return NextResponse.json(
      { error: 'Failed to verify user', details: String(error) },
      { status: 500, headers: JSON_HEADERS }
    )
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

