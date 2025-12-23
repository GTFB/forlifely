import { InferSelectModel } from 'drizzle-orm'
import { goals } from '../schema/goals'

export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export type AdminTaskEntity = InferSelectModel<typeof goals>

export interface TaskAssignee {
  uuid?: string
  name: string
  avatar?: string | null
}

export interface AdminTaskDataIn {
  priority?: TaskPriority
  clientLink?: string
  assigneeUuid?: string
  assigneeName?: string
  assigneeAvatar?: string | null
  createdByUuid?: string
  deadline?: string
}

export interface TaskApi {
  uuid: string
  title: string
  clientLink?: string
  priority: TaskPriority
  status: TaskStatus
  assignee: TaskAssignee
  createdAt?: string | null
  updatedAt?: string | null
}

export type TaskResponse = TaskApi

export interface CreateTaskPayload {
  title?: string
  clientLink?: string
  priority?: TaskPriority
  status?: TaskStatus
  assigneeUuid?: string
  assigneeName?: string
}

export interface UpdateTaskPayload {
  status?: TaskStatus
}

export interface CurrentUser {
  uuid: string
  name: string
  roles: { name?: string }[]
  isAdmin: boolean
}

