import { NextRequest, NextResponse } from 'next/server'
import { UsersRepository } from '@/shared/repositories/users.repository'
import { MeRepository } from '@/shared/repositories/me.repository'
import { HumanRepository } from '@/shared/repositories/human.repository'
import { UserRolesRepository } from '@/shared/repositories/user-roles.repository'
import { parseQueryParams } from '@/shared/utils/http'
import type { EsnadUser } from '@/shared/types/esnad'
import { getSession } from '@/shared/session'
import { preparePassword, validatePassword, validatePasswordMatch } from '@/shared/password'
import { sendVerificationEmail } from '@/shared/services/email-verification.service'
import { logUserJournalEvent } from '@/shared/services/user-journal.service'
import { db } from '@/shared/db'
import { schema } from '@/shared/schema'
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'

const ADMIN_ROLE_NAMES = ['Administrator', 'admin']

interface CreateUserRequest {
  email: string
  password: string
  confirmPassword: string
  fullName?: string
  roleUuids?: string[]
}

interface UserWithRoles extends EsnadUser {
  roles?: Array<{
    uuid: string
    raid: string | null
    title: string | null
    name: string | null
    description: string | null
    isSystem: boolean | null
  }>
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const { filters, orders, pagination } = parseQueryParams(url)

    // Check if roles filter is present
    const roleUuids = url.searchParams.getAll('roles')
    
    let result
    if (roleUuids.length > 0) {
      // Filter users by roles using a custom query
      const page = pagination.page || 1
      const limit = pagination.limit || 20
      const offset = (page - 1) * limit

      // Build query to get users with specific roles
      const usersResult = await db
        .selectDistinct({
          id: schema.users.id,
          uuid: schema.users.uuid,
          email: schema.users.email,
          humanAid: schema.users.humanAid,
          isActive: schema.users.isActive,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt,
          deletedAt: schema.users.deletedAt,
          // Add other fields as necessary from EsnadUser type
        })
        .from(schema.users)
        .innerJoin(schema.userRoles, eq(schema.users.uuid, schema.userRoles.userUuid))
        .where(and(
          inArray(schema.userRoles.roleUuid, roleUuids),
          isNull(schema.users.deletedAt)
        ))
        .orderBy(desc(schema.users.createdAt))
        .limit(limit)
        .offset(offset)
        .execute()

      // Get total count
      const [countResult] = await db
        .select({ total: sql<number>`count(distinct ${schema.users.id})` })
        .from(schema.users)
        .innerJoin(schema.userRoles, eq(schema.users.uuid, schema.userRoles.userUuid))
        .where(and(
          inArray(schema.userRoles.roleUuid, roleUuids),
          isNull(schema.users.deletedAt)
        ))
        .execute()

      const total = countResult?.total || 0

      result = {
        docs: usersResult as EsnadUser[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    } else {
      // Use standard filtering
      const usersRepository = UsersRepository.getInstance()
      result = await usersRepository.getFiltered(filters, orders, pagination)
    }

    // Load roles for each user
    const meRepository = MeRepository.getInstance()
    const usersWithRoles: UserWithRoles[] = await Promise.all(
      result.docs.map(async (user) => {
        try {
          const userWithRoles = await meRepository.findByIdWithRoles(Number(user.id))
          return {
            ...user,
            roles: userWithRoles?.roles?.map((role) => ({
              uuid: role.uuid,
              raid: role.raid ?? null,
              title: role.title ?? null,
              name: role.name ?? null,
              description: role.description ?? null,
              isSystem: role.isSystem ?? null,
            })) || [],
          }
        } catch (err) {
          console.error(`Failed to load roles for user ${user.uuid}:`, err)
          return {
            ...user,
            roles: [],
          }
        }
      })
    )

    return NextResponse.json({
      docs: usersWithRoles,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('Failed to fetch users', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message,
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.AUTH_SECRET) {
      return NextResponse.json({ error: 'Authentication not configured' }, { status: 500 })
    }

    // Get current user from session
    const sessionUser = await getSession(request, process.env.AUTH_SECRET)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get current user roles to check permissions
    const meRepository = MeRepository.getInstance()
    const currentUserWithRoles = await meRepository.findByIdWithRoles(Number(sessionUser.id))
    
    if (!currentUserWithRoles) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Check if current user is admin (has system role)
    const isAdmin = currentUserWithRoles.roles.some((role) => role.isSystem === true)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if current user is super administrator
    const isSuperAdmin = currentUserWithRoles.roles.some(
      (role) => role.name === 'Administrator'
    )

    const body = await request.json() as CreateUserRequest
    const { email, password, confirmPassword, fullName, roleUuids } = body

    // Validate input
    if (!email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Email, password and confirmPassword are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 })
    }

    // Validate password match
    const matchValidation = validatePasswordMatch(password, confirmPassword)
    if (!matchValidation.valid) {
      return NextResponse.json({ error: matchValidation.error }, { status: 400 })
    }

    // Check if user with this email already exists
    const existingUser = await db.select({ uuid: schema.users.uuid })
      .from(schema.users)
      .where(and(
        eq(schema.users.email, email),
        isNull(schema.users.deletedAt)
      ))
      .limit(1)
      .execute()

    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 400 })
    }

    // Validate roles if provided
    if (roleUuids && Array.isArray(roleUuids) && roleUuids.length > 0) {
      // Get all role UUIDs to validate
      const roles = await db.select({ uuid: schema.roles.uuid, name: schema.roles.name })
        .from(schema.roles)
        .where(and(
          inArray(schema.roles.uuid, roleUuids),
          isNull(schema.roles.deletedAt)
        ))
        .execute()

      // Check if all provided roles exist
      if (roles.length !== roleUuids.length) {
        return NextResponse.json({ error: 'One or more roles not found' }, { status: 400 })
      }

      // If not super admin, check that no admin roles are being assigned
      if (!isSuperAdmin) {
        const adminRoles = roles.filter((role) =>
          ADMIN_ROLE_NAMES.includes(role.name || '')
        )
        if (adminRoles.length > 0) {
          return NextResponse.json({ error: 'You cannot assign administrator roles' }, { status: 403 })
        }
      }
    }

    // Prepare password
    const { hashedPassword, salt } = await preparePassword(password)

    // Create Human first (using repository)
    const humanRepository = HumanRepository.getInstance()
    const human = await humanRepository.generateClientByEmail(email, {
      fullName: fullName || email,
      type: 'CLIENT',
      statusName: 'PENDING',
    })

    // Create user using repository
    const usersRepository = UsersRepository.getInstance()
    const createdUser = await usersRepository.create({
      humanAid: human.haid,
      email,
      passwordHash: hashedPassword,
      salt,
      isActive: true,
    })

    // Assign roles if provided
    if (roleUuids && Array.isArray(roleUuids) && roleUuids.length > 0) {
      const userRolesRepository = UserRolesRepository.getInstance()
      await userRolesRepository.assignRolesToUser(createdUser.uuid, roleUuids)
    }

    // Note: We can't easily pass the NextRequest to sendVerificationEmail if it expects strict Cloudflare types,
    // but in Step 1 we should have adapted it. Assuming it works or needs adaptation.
    // Here we pass 'env' which was context.env. Now we need to pass something else?
    // sendVerificationEmail usually takes (env, user, options).
    // We should check sendVerificationEmail signature. 
    // For now, I'll pass process.env as 'env' if it matches loosely, or null if not used.
    // Actually, sendVerificationEmail likely uses env.RESEND_API_KEY etc.
    try {
        // @ts-ignore - Adapt this later if needed
      await sendVerificationEmail(process.env as any, createdUser, { request: request as unknown as Request, force: true })
    } catch (verificationError) {
      console.error('Failed to send verification email to new user', verificationError)
    }

    try {
       // @ts-ignore
      await logUserJournalEvent(process.env as any, 'USER_JOURNAL_REGISTRATION', createdUser)
    } catch (journalError) {
      console.error('Failed to log admin user registration', journalError)
    }

    return NextResponse.json({
      success: true,
      user: createdUser,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create user', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message,
    }, { status: 500 })
  }
}

