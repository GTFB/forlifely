import { and, eq, isNull, sql } from "drizzle-orm"
import BaseRepository from "./BaseRepositroy"
import { schema } from "../schema"
import type { UserSession, NewUserSession } from "../schema/types"

export class UserSessionsRepository extends BaseRepository<UserSession> {
  constructor() {
    super(schema.userSessions)
  }

  public static getInstance(): UserSessionsRepository {
    return new UserSessionsRepository()
  }

  public async createSession(input: {
    sessionUuid: string
    userId: number
    userAgent?: string | null
    ip?: string | null
    expiresAt: string
  }): Promise<void> {
    const now = new Date().toISOString()
    const row: NewUserSession = {
      uuid: input.sessionUuid,
      userId: input.userId,
      userAgent: input.userAgent ?? null,
      ip: input.ip ?? null,
      lastSeenAt: now,
      expiresAt: input.expiresAt,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    } as any

    await this.db.insert(schema.userSessions).values(row as any).execute()
  }

  public async listActiveByUserId(userId: number): Promise<UserSession[]> {
    const nowIso = new Date().toISOString()
    return (await this.db
      .select()
      .from(schema.userSessions)
      .where(
        and(
          eq(schema.userSessions.userId, userId),
          isNull(schema.userSessions.revokedAt),
          sql`${schema.userSessions.expiresAt} is null OR ${schema.userSessions.expiresAt} > ${nowIso}`,
        ) as any,
      )
      .orderBy(sql`${schema.userSessions.lastSeenAt} desc`)
      .execute()) as UserSession[]
  }

  public async revokeSession(sessionUuid: string, userId: number): Promise<void> {
    const now = new Date().toISOString()
    await this.db
      .update(schema.userSessions)
      .set({ revokedAt: now, updatedAt: now } as any)
      .where(and(eq(schema.userSessions.uuid, sessionUuid), eq(schema.userSessions.userId, userId)) as any)
      .execute()
  }

  public async touch(sessionUuid: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db
      .update(schema.userSessions)
      .set({ lastSeenAt: now, updatedAt: now } as any)
      .where(eq(schema.userSessions.uuid, sessionUuid))
      .execute()
  }

  public async isActiveSessionForUser(sessionUuid: string, userId: number): Promise<boolean> {
    const nowIso = new Date().toISOString()
    const rows = await this.db
      .select()
      .from(schema.userSessions)
      .where(
        and(
          eq(schema.userSessions.uuid, sessionUuid),
          eq(schema.userSessions.userId, userId),
          isNull(schema.userSessions.revokedAt),
          sql`${schema.userSessions.expiresAt} is null OR ${schema.userSessions.expiresAt} > ${nowIso}`,
        ) as any,
      )
      .limit(1)
      .execute()
    return rows.length > 0
  }
}

export function getClientIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() || null
  const cf = request.headers.get("cf-connecting-ip")
  if (cf) return cf.trim()
  return null
}


