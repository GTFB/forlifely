import { and, eq, isNull, sql } from "drizzle-orm"
import BaseRepository from "./BaseRepositroy"
import { schema } from "../schema"
import type { UserSession, NewUserSession } from "../schema/types"
import { isPostgres } from "../utils/db"
import { SESSION_COOKIE_MAX_AGE_SECONDS } from "../session"

export class UserSessionsRepository extends BaseRepository<UserSession> {
  constructor() {
    super(schema.userSessions)
  }

  public static getInstance(): UserSessionsRepository {
    return new UserSessionsRepository()
  }

  private static tableEnsured = false

  private async ensureTable(): Promise<void> {
    if (UserSessionsRepository.tableEnsured) return
    if (!isPostgres()) return
    try {
      // Probe
      await this.db.execute(sql`SELECT 1 FROM user_sessions LIMIT 1`)
      UserSessionsRepository.tableEnsured = true
      return
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (!/user_sessions/i.test(msg) || !/does not exist|undefined_table|relation/i.test(msg)) {
        // Unknown error, don't attempt DDL
        throw e
      }
    }

    // Create table if missing
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id serial PRIMARY KEY,
        uuid text NOT NULL,
        user_id integer NOT NULL,
        user_agent text,
        ip text,
        last_seen_at text,
        expires_at text,
        revoked_at text,
        created_at text,
        updated_at text
      );
    `)
    await this.db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);`)
    await this.db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_uuid ON user_sessions (uuid);`)
    UserSessionsRepository.tableEnsured = true
  }

  public async createSession(input: {
    sessionUuid: string
    userId: number
    userAgent?: string | null
    ip?: string | null
    expiresAt: string
  }): Promise<void> {
    await this.ensureTable()
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

  public async ensureActiveSession(input: {
    sessionUuid: string
    userId: number
    userAgent?: string | null
    ip?: string | null
  }): Promise<boolean> {
    await this.ensureTable()
    const nowIso = new Date().toISOString()
    const [row] = (await this.db
      .select()
      .from(schema.userSessions)
      .where(and(eq(schema.userSessions.uuid, input.sessionUuid), eq(schema.userSessions.userId, input.userId)) as any)
      .limit(1)
      .execute()) as UserSession[]

    if (!row) {
      const expiresAt = new Date(Date.now() + SESSION_COOKIE_MAX_AGE_SECONDS * 1000).toISOString()
      await this.createSession({
        sessionUuid: input.sessionUuid,
        userId: input.userId,
        userAgent: input.userAgent ?? null,
        ip: input.ip ?? null,
        expiresAt,
      })
      return true
    }

    if (row.revokedAt) return false
    if (row.expiresAt && row.expiresAt <= nowIso) return false

    await this.touch(input.sessionUuid)
    return true
  }

  public async listActiveByUserId(userId: number): Promise<UserSession[]> {
    await this.ensureTable()
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
    await this.ensureTable()
    const now = new Date().toISOString()
    await this.db
      .update(schema.userSessions)
      .set({ revokedAt: now, updatedAt: now } as any)
      .where(and(eq(schema.userSessions.uuid, sessionUuid), eq(schema.userSessions.userId, userId)) as any)
      .execute()
  }

  public async touch(sessionUuid: string): Promise<void> {
    await this.ensureTable()
    const now = new Date().toISOString()
    await this.db
      .update(schema.userSessions)
      .set({ lastSeenAt: now, updatedAt: now } as any)
      .where(eq(schema.userSessions.uuid, sessionUuid))
      .execute()
  }

  public async isActiveSessionForUser(sessionUuid: string, userId: number): Promise<boolean> {
    await this.ensureTable()
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


