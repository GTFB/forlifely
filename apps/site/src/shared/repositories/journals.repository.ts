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
    // Determine action based on previous snapshot and status change
    let action: 'LOAN_APPLICATION_SNAPSHOT' | 'DEAL_APPROVED' | 'DEAL_STATUS_CHANGE' | 'DEAL_REJECTED' | 'DEAL_CANCELLED' = 'LOAN_APPLICATION_SNAPSHOT'
    
    if (previousSnapshot) {
      // If there's a previous snapshot, check if status changed
      if (previousSnapshot.statusName !== snapshot.statusName) {
        if (snapshot.statusName === 'APPROVED') {
          action = 'DEAL_APPROVED'
        } else if (snapshot.statusName === 'REJECTED' || snapshot.statusName === 'CANCELLED') {
          action = snapshot.statusName === 'REJECTED' ? 'DEAL_REJECTED' : 'DEAL_CANCELLED'
        } else {
          action = 'DEAL_STATUS_CHANGE'
        }
      } else {
        // Status didn't change, but other fields might have - treat as status change
        action = 'DEAL_STATUS_CHANGE'
      }
    }
    // If previousSnapshot is null, it's a new application -> 'LOAN_APPLICATION_SNAPSHOT'

    // Build detailed description
    const snapshotDataIn = typeof snapshot.dataIn === 'string' 
      ? JSON.parse(snapshot.dataIn) 
      : (snapshot.dataIn as Record<string, unknown>)
    
    const previousDataIn = previousSnapshot && (typeof previousSnapshot.dataIn === 'string'
      ? JSON.parse(previousSnapshot.dataIn)
      : (previousSnapshot.dataIn as Record<string, unknown>))
    
    let description = ''
    const firstName = (snapshotDataIn?.firstName as string) || ''
    const lastName = (snapshotDataIn?.lastName as string) || ''
    const middleName = (snapshotDataIn?.middleName as string) || ''
    const fullName = snapshotDataIn?.fullName as string || [lastName, firstName, middleName].filter(Boolean).join(' ') || 'клиента'
    
    const productName = (snapshotDataIn?.productName as string) || ''
    const productPrice = snapshotDataIn?.productPrice ? Number(snapshotDataIn.productPrice) : 0
    const amountText = productPrice > 0 ? `${productPrice.toLocaleString('ru-RU')} ₽` : ''

    if (action === 'LOAN_APPLICATION_SNAPSHOT') {
      description = `Создана новая заявка на рассрочку от ${fullName}${productName ? ` на товар "${productName}"` : ''}${amountText ? ` на сумму ${amountText}` : ''}`
    } else if (action === 'DEAL_APPROVED') {
      description = `Одобрена заявка на рассрочку от ${fullName}${productName ? ` на товар "${productName}"` : ''}${amountText ? ` на сумму ${amountText}` : ''}. Статус изменен с "${previousSnapshot?.statusName || 'неизвестно'}" на "APPROVED"`
    } else if (action === 'DEAL_REJECTED' || action === 'DEAL_CANCELLED') {
      const actionText = action === 'DEAL_REJECTED' ? 'Отклонена' : 'Отменена'
      description = `${actionText} заявка на рассрочку от ${fullName}${productName ? ` на товар "${productName}"` : ''}${amountText ? ` на сумму ${amountText}` : ''}. Статус изменен с "${previousSnapshot?.statusName || 'неизвестно'}" на "${snapshot.statusName}"`
    } else if (action === 'DEAL_STATUS_CHANGE') {
      description = `Изменен статус заявки на рассрочку от ${fullName}${productName ? ` на товар "${productName}"` : ''}${amountText ? ` на сумму ${amountText}` : ''}. Статус изменен с "${previousSnapshot?.statusName || 'неизвестно'}" на "${snapshot.statusName}"`
    }

    const details: LoanApplicationSnapshotDetails & { description?: string; statusName?: string } = {
      snapshot,
      previousSnapshot,
      description,
      statusName: snapshot.statusName,
    }
    
    const journal: NewJournalLoanApplicationSnapshot & { action: string } = {
      action: action,
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
