import { NextRequest, NextResponse } from 'next/server'
import { UsersRepository } from '@/shared/repositories/users.repository'
import { MeRepository } from '@/shared/repositories/me.repository'
import { UserRolesRepository } from '@/shared/repositories/user-roles.repository'
import { HumanRepository } from '@/shared/repositories/human.repository'
import { preparePassword, validatePassword } from '@/shared/password'
import { withAdminGuard, AuthenticatedRequestContext } from '@/shared/api-guard'
import { createDb } from '@/shared/repositories/utils'
import { schema } from '@/shared/schema'
import { and, eq, isNull, inArray } from 'drizzle-orm'
import type { ClientDataIn, KycStatus } from '@/shared/types/esnad'

const ADMIN_ROLE_NAMES = ['Administrator', 'admin']

interface UpdateUserRequest {
  email?: string
  password?: string
  fullName?: string
  isActive?: boolean
  roleUuids?: string[]
  emailVerified?: boolean
  kycStatus?: KycStatus
  monthlyIncome?: string
  monthlyExpenses?: string
  workPlace?: string
  workExperience?: string
}

const handleGet = async (
  context: AuthenticatedRequestContext,
  identifier: string
) => {
  const { request } = context
  try {
    const meRepository = MeRepository.getInstance()
    const usersRepository = UsersRepository.getInstance()
    const humanRepository = HumanRepository.getInstance()

    let user = null

    // Check if identifier is a haid (starts with 'H-' or 'h-')
    if (identifier.startsWith('H-') || identifier.startsWith('h-')) {
      // Find user by humanAid (haid)
      const [userRecord] = await createDb()
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.humanAid, identifier),
            isNull(schema.users.deletedAt)
          )
        )
        .limit(1)
        .execute()

      if (!userRecord) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      user = userRecord as any
    } else {
      // Find user by UUID
      user = await usersRepository.findByUuid(identifier)
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user with roles
    const userWithRoles = await meRepository.findByIdWithRoles(Number(user.id))

    // Get human data
    let human = null
    if (user.humanAid) {
      human = await humanRepository.findByHaid(user.humanAid)
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        roles: userWithRoles?.roles || [],
        human: human || null,
      },
    })
  } catch (error) {
    console.error('Failed to fetch user', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message,
    }, { status: 500 })
  }
}

const handlePut = async (
  context: AuthenticatedRequestContext,
  uuid: string
) => {
  const { request, user: currentUserWithRoles } = context
  try {
    // Check if current user is admin
    const isAdmin = currentUserWithRoles.roles.some((role) => role.isSystem === true)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if current user is super administrator
    const isSuperAdmin = currentUserWithRoles.roles.some(
      (role) => role.name === 'Administrator'
    )

    const body = await request.json() as UpdateUserRequest
    const {
      email,
      password,
      fullName,
      isActive,
      roleUuids,
      emailVerified,
      kycStatus,
      monthlyIncome,
      monthlyExpenses,
      workPlace,
      workExperience,
    } = body

    const usersRepository = UsersRepository.getInstance()
    const existingUser = await usersRepository.findByUuid(uuid)

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const db = createDb()
    const updateData: any = {}

    // Update email if provided
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }

      // Check if email is already taken by another user
      const emailUser = await db
        .select({ uuid: schema.users.uuid })
        .from(schema.users)
        .where(and(
          eq(schema.users.email, email),
          isNull(schema.users.deletedAt)
        ))
        .limit(1)
        .execute()

      if (emailUser.length > 0 && emailUser[0].uuid !== uuid) {
        return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 400 })
      }

      updateData.email = email
    }

    // Update password if provided
    if (password !== undefined && password !== '') {
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        return NextResponse.json({ error: passwordValidation.error }, { status: 400 })
      }

      const { hashedPassword, salt } = await preparePassword(password)
      updateData.passwordHash = hashedPassword
      updateData.salt = salt
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // Update emailVerifiedAt if emailVerified is provided
    if (emailVerified !== undefined) {
      updateData.emailVerifiedAt = emailVerified ? new Date().toISOString() : null
    }

    // Update user
    if (Object.keys(updateData).length > 0) {
      await usersRepository.update(uuid, updateData)
    }

    // Update human-related data (fullName, kycStatus, financial info)
    if (
      (fullName !== undefined ||
        kycStatus !== undefined ||
        monthlyIncome !== undefined ||
        monthlyExpenses !== undefined ||
        workPlace !== undefined ||
        workExperience !== undefined) &&
      existingUser.humanAid
    ) {
      const humanRepository = HumanRepository.getInstance()
      const human = await humanRepository.findByHaid(existingUser.humanAid)
      if (human) {
        const humanUpdate: any = {}

        if (fullName !== undefined) {
          humanUpdate.fullName = fullName.trim()
        }

        // merge/update dataIn for kycStatus and financial fields
        if (
          kycStatus !== undefined ||
          monthlyIncome !== undefined ||
          monthlyExpenses !== undefined ||
          workPlace !== undefined ||
          workExperience !== undefined
        ) {
          let dataIn: ClientDataIn & Record<string, any> = {}
          if (human.dataIn) {
            try {
              dataIn =
                typeof human.dataIn === 'string'
                  ? (JSON.parse(human.dataIn) as ClientDataIn & Record<string, any>)
                  : (human.dataIn as ClientDataIn & Record<string, any>)
            } catch (err) {
              console.error('Failed to parse human.dataIn while updating kycStatus/financial info:', err)
              dataIn = {}
            }
          }

          if (kycStatus !== undefined) {
            dataIn.kycStatus = kycStatus
          }
          if (monthlyIncome !== undefined) {
            dataIn.monthlyIncome = monthlyIncome
          }
          if (monthlyExpenses !== undefined) {
            dataIn.monthlyExpenses = monthlyExpenses
          }
          if (workPlace !== undefined) {
            dataIn.workPlace = workPlace
          }
          if (workExperience !== undefined) {
            dataIn.workExperience = workExperience
          }

          humanUpdate.dataIn = dataIn as any
        }

        if (Object.keys(humanUpdate).length > 0) {
          await humanRepository.update(human.uuid, humanUpdate)
        }
      }
    }

    // Update roles if provided
    if (roleUuids !== undefined && Array.isArray(roleUuids)) {
      // Validate roles if provided
      if (roleUuids.length > 0) {
        const roles = await db
          .select({ uuid: schema.roles.uuid, name: schema.roles.name })
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
          const adminRoles = roles.filter((role: { name: string | null }) =>
            ADMIN_ROLE_NAMES.includes(role.name || '')
          )
          if (adminRoles.length > 0) {
            return NextResponse.json({ error: 'You cannot assign administrator roles' }, { status: 403 })
          }
        }
      }

      const userRolesRepository = UserRolesRepository.getInstance()
      // Remove all existing roles
      await userRolesRepository.removeAllRolesFromUser(uuid)
      // Assign new roles
      if (roleUuids.length > 0) {
        await userRolesRepository.assignRolesToUser(uuid, roleUuids)
      }
    }

    // Get updated user with roles
    const updatedUser = await usersRepository.findByUuid(uuid)
    const meRepository = MeRepository.getInstance()
    const userWithRoles = await meRepository.findByIdWithRoles(Number(updatedUser.id))

    // Get human data
    let human = null
    if (updatedUser.humanAid) {
      const humanRepository = HumanRepository.getInstance()
      human = await humanRepository.findByHaid(updatedUser.humanAid)
    }

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        roles: userWithRoles?.roles || [],
        human: human || null,
      },
    })
  } catch (error) {
    console.error('Failed to update user', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message,
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ uuid: string }> }
) {
  const params = await context.params
  return withAdminGuard(async (ctx: AuthenticatedRequestContext) => {
    return handleGet(ctx, params.uuid) // uuid parameter can be either UUID or haid
  })(request, { params: Promise.resolve(params) })
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ uuid: string }> }
) {
  const params = await context.params
  return withAdminGuard(async (ctx: AuthenticatedRequestContext) => {
    return handlePut(ctx, params.uuid)
  })(request, { params: Promise.resolve(params) })
}

