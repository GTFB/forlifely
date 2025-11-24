import type { D1Database } from '@cloudflare/workers-types'
import { schema } from '../schema'
import type { Journal } from '../schema/types'
import BaseRepository from './BaseRepositroy'
import { buildDbFilters, buildDbOrders, stringifyJson } from './utils'
import { JournalLoanApplicationSnapshot, LoanApplication, LoanApplicationSnapshotDetails, NewJournalLoanApplicationSnapshot } from '../types/esnad'
import { DbFilters, DbOrders, DbPaginatedResult, DbPagination } from '../types/shared'
import { sql } from 'drizzle-orm'

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

  private constructor() {
    super(schema.journals)
  }

  public static getInstance(): JournalsRepository {
    return new JournalsRepository()
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

    await this.db
      .execute(sql`INSERT INTO journals (uuid, user_id, action, details, xaid, created_at, updated_at)
         VALUES (${uuid}, ${userId}, ${step}, ${detailsString}, ${xaid}, ${timestamp}, ${timestamp})`
      )
  }
  public async createLoanApplicationSnapshot(snapshot: LoanApplication, previousSnapshot: LoanApplication | null, userId: number | string | null): Promise<JournalLoanApplicationSnapshot> {
    const details: LoanApplicationSnapshotDetails = {
      snapshot,
      previousSnapshot,
    }
    const journal: NewJournalLoanApplicationSnapshot = {
      action: 'LOAN_APPLICATION_SNAPSHOT',
      uuid: crypto.randomUUID(),
      details,
      userId: userId as number | undefined,
    }
    return await this.create(journal) as JournalLoanApplicationSnapshot
  }
  public async getFiltered(filters: DbFilters, orders: DbOrders, pagination: DbPagination): Promise<DbPaginatedResult<Journal>> {
    const query = this.getSelectQuery()
    const where = buildDbFilters(this.schema, filters)
    const order = buildDbOrders(this.schema, orders)
    
    const limit = Math.max(1, Math.min(pagination.limit ?? 10, 100))
    const page = Math.max(1, pagination.page ?? 1)
    const offset = (page - 1) * limit

    // Get total count
    const countQuery = this.getSelectQuery()
    const totalRows = where 
      ? await countQuery.where(where).execute()
      : await countQuery.execute()
    const total = totalRows.length

    const resultQuery = where 
      ? query.where(where).orderBy(...order).limit(limit).offset(offset)
      : query.orderBy(...order).limit(limit).offset(offset)
    const result = await resultQuery.execute() as Journal[]

    return {
      docs: result,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    }
  }
}
