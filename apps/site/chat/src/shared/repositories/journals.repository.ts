import type { D1Database } from '@cloudflare/workers-types'
import { schema } from '../schema'
import type { Journal } from '../schema/types'
import BaseRepository from './BaseRepositroy'
import { stringifyJson, SiteDb } from './utils'

type JournalStatus = 'info' | 'success' | 'error'

export type JournalLogInput = {
  context: string
  step: string
  status?: JournalStatus
  message?: string
  payload?: unknown
  error?: unknown
  uuid?: string
  userId?: number | string | null
  xaid?: string | null
}

export class JournalsRepository extends BaseRepository<Journal> {
  private ensureTablePromise?: Promise<void>

  private constructor(db: D1Database | SiteDb) {
    super(db, schema.journals)
  }

  public static getInstance(db: D1Database | SiteDb): JournalsRepository {
    return new JournalsRepository(db)
  }

  private ensureTable(): Promise<void> {
    if (this.d1DB && !this.ensureTablePromise) {
      this.ensureTablePromise = (async () => {
        await this.d1DB!
          .prepare(
            `
            CREATE TABLE IF NOT EXISTS journals (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER,
              uuid TEXT NOT NULL,
              details TEXT NOT NULL,
              action TEXT NOT NULL,
              xaid TEXT,
              created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
              updated_at TEXT
            )
            `
          )
          .run()
      })()
    }
    return this.ensureTablePromise || Promise.resolve()
  }

  public async log(entry: JournalLogInput): Promise<void> {
    const {
      context,
      step,
      status = 'info',
      message,
      payload,
      error,
      uuid = crypto.randomUUID(),
      userId = null,
      xaid = null,
    } = entry

    if (this.d1DB) {
      await this.ensureTable()

      const detailsString =
        stringifyJson({
          context,
          status,
          message,
          payload,
          error:
            typeof error === 'string'
              ? { message: error }
              : error,
        }) ?? '{}'

      const timestamp = new Date().toISOString()

      await this.d1DB
        .prepare(
          `INSERT INTO journals (uuid, user_id, action, details, xaid, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          uuid,
          userId,
          step,
          detailsString,
          xaid,
          timestamp,
          timestamp
        )
        .run()
      return
    }

    // SiteDb implementation
    const details = {
      context,
      status,
      message,
      payload,
      error: typeof error === 'string' ? { message: error } : error,
    }

    await this.db.insert(schema.journals).values({
      uuid,
      user_id: typeof userId === 'number' ? userId : null,
      action: step,
      details,
      xaid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).execute()
  }
}
