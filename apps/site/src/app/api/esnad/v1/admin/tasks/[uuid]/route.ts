import { NextRequest, NextResponse } from 'next/server'
import { GoalsRepository } from '@/shared/repositories/goals.repository'
import { buildRequestEnv } from '@/shared/env'
import { getSession } from '@/shared/session'
import { MeRepository, type UserWithRoles } from '@/shared/repositories/me.repository'
import type { Goal } from '@/shared/schema/types'
import { parseJson } from '@/shared/repositories/utils'
import {
  AdminTaskDataIn,
  TaskPriority,
  TaskResponse,
  TaskStatus,
  UpdateTaskPayload,
} from '@/shared/types/tasks'

const jsonHeaders = { 'content-type': 'application/json' }

const uiStatusToDb = (status: TaskStatus | undefined): string => {
  switch (status) {
    case 'in-progress':
      return 'IN_PROGRESS'
    case 'done':
      return 'DONE'
    case 'todo':
    default:
      return 'TODO'
  }
}

const dbStatusToUi = (statusName?: string | null): TaskStatus => {
  const normalized = (statusName || '').toUpperCase()
  switch (normalized) {
    case 'IN_PROGRESS':
      return 'in-progress'
    case 'DONE':
      return 'done'
    default:
      return 'todo'
  }
}

const normalizePriority = (priority?: string | null): TaskPriority => {
  const normalized = (priority || '').toLowerCase()
  if (normalized === 'high') return 'high'
  if (normalized === 'low') return 'low'
  return 'medium'
}

const mapGoalToTask = (goal: Goal): TaskResponse => {
  const dataIn = parseJson<AdminTaskDataIn>(goal.dataIn, {})
  return {
    uuid: goal.uuid,
    title: goal.title || 'Без названия',
    status: dbStatusToUi(goal.statusName),
    priority: normalizePriority(dataIn?.priority),
    clientLink: dataIn?.clientLink || '',
    assignee: {
      uuid: dataIn?.assigneeUuid,
      name: dataIn?.assigneeName || 'Не назначен',
      avatar: dataIn?.assigneeAvatar ?? null,
    },
    createdAt: goal.createdAt || null,
    updatedAt: goal.updatedAt || null,
  }
}

const isAdminUser = (user: UserWithRoles): boolean =>
  user.roles.some((role) => role.name === 'Administrator' || role.name === 'admin' || role.isSystem === true)

const authenticate = async (
  request: NextRequest
): Promise<{ user: UserWithRoles } | { response: NextResponse }> => {
  const env = buildRequestEnv()

  if (!env.AUTH_SECRET) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Authentication not configured',
        },
        { status: 500, headers: jsonHeaders }
      ),
    }
  }

  const session = await getSession(request, env.AUTH_SECRET)
  if (!session?.id) {
    return {
      response: NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401, headers: jsonHeaders }
      ),
    }
  }

  const meRepo = MeRepository.getInstance()
  const user = await meRepo.findByIdWithRoles(Number(session.id), { includeHuman: true })

  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'User not found' },
        { status: 401, headers: jsonHeaders }
      ),
    }
  }

  return { user }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ uuid: string }> }
) {
  const auth = await authenticate(request)
  if ('response' in auth) {
    return auth.response
  }

  const { uuid } = await context.params

  let body: UpdateTaskPayload
  try {
    body = (await request.json()) as UpdateTaskPayload
  } catch {
    return NextResponse.json(
      { success: false, error: 'BAD_REQUEST', message: 'Invalid JSON body' },
      { status: 400, headers: jsonHeaders }
    )
  }

  if (!body.status) {
    return NextResponse.json(
      { success: false, error: 'VALIDATION_ERROR', message: 'Status is required' },
      { status: 400, headers: jsonHeaders }
    )
  }

  try {
    const goalsRepository = GoalsRepository.getInstance()
    const existing = await goalsRepository.findAdminTaskByUuid(uuid)

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Task not found' },
        { status: 404, headers: jsonHeaders }
      )
    }

    const isAdmin = isAdminUser(auth.user)
    if (!isAdmin && existing.xaid && existing.xaid !== auth.user.user.uuid) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'You cannot modify this task' },
        { status: 403, headers: jsonHeaders }
      )
    }

    const updated = await goalsRepository.update(uuid, {
      statusName: uiStatusToDb(body.status),
    })

    return NextResponse.json(
      {
        success: true,
        task: mapGoalToTask(updated as Goal),
      },
      { status: 200, headers: jsonHeaders }
    )
  } catch (error) {
    console.error('Failed to update task', error)
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500, headers: jsonHeaders }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...jsonHeaders,
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'PATCH, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  })
}

