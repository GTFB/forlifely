import { eq, sql } from 'drizzle-orm'
import BaseRepository from './BaseRepositroy'
import { schema } from '../schema'
import { NewText, Text } from '../schema/types'
import { withNotDeleted } from './utils'
import { generateAid } from '../generate-aid'
import { EsnadText, EsnadTextDataIn } from '../types/esnad'
import { NewEsnadText } from '../types/esnad'
import { DbFilters, DbOrders, DbPaginatedResult, DbPagination } from '../types/shared'

export class TextsRepository extends BaseRepository<EsnadText> {
  constructor() {
    super(schema.texts)
  }

  public static getInstance(): TextsRepository {
    return new TextsRepository()
  }

  protected async beforeCreate(data: Partial<NewEsnadText>): Promise<void> {
    if (!data.uuid) {
      data.uuid = crypto.randomUUID()
    }
    if (!data.taid) {
      data.taid = generateAid('t')
    }
    if (!data.statusName) {
      data.statusName = 'DRAFT'
    }
    if (typeof data.isPublic === 'undefined') {
      data.isPublic = true
    }
  }

  public async findByType(type: string, statusName?: string): Promise<EsnadText[]> {
    const condition = withNotDeleted(
      this.schema.deletedAt,
      eq(this.schema.type, type),
      statusName ? eq(this.schema.statusName, statusName) : undefined
    )

    const rows = await this.db.select().from(this.schema).where(condition).execute()
    return rows as EsnadText[]
  }

  public async findPublishedByType(type: string): Promise<EsnadText[]> {
    return this.findByType(type, 'PUBLISHED') as Promise<EsnadText[]>
  }

  public async updateStatus(uuid: string, statusName: string): Promise<EsnadText> {
    return this.update(uuid, { statusName })
  }
  public async findBySlug(slug: EsnadTextDataIn['slug']): Promise<EsnadText | null> {
    const condition = withNotDeleted(
      this.schema.deletedAt,
      sql`${this.schema.dataIn}::jsonb->>'slug' = ${slug}`
    )

    const [text] = await this.db
      .select()
      .from(this.schema)
      .where(condition)
      .limit(1)
      .execute()

    return (text as EsnadText | undefined) || null
  }

  public async findByTaid(taid: string): Promise<EsnadText | null> {
    const condition = withNotDeleted(
      this.schema.deletedAt,
      eq(this.schema.taid, taid)
    )

    const [text] = await this.db
      .select()
      .from(this.schema)
      .where(condition)
      .limit(1)
      .execute()

    return text ? (text as EsnadText) : null
  }

  public async getFilteredBlog(filters: DbFilters, orders: DbOrders, pagination: DbPagination): Promise<DbPaginatedResult<EsnadText>> {
    filters.conditions = filters.conditions ?? []
    filters.conditions.push({
      field: 'type',
      operator: 'eq',
      values: ['BLOG']
    })
    // Исключаем удалённые записи
    filters.conditions.push({
      field: 'deletedAt',
      operator: 'isNull',
      values: []
    })

    // Default order by id desc if no order specified
    if (!orders.orders || orders.orders.length === 0) {
      orders.orders = [{
        field: 'id',
        direction: 'desc',
      }]
    }

    return this.getFiltered(filters, orders, pagination) as Promise<DbPaginatedResult<EsnadText>>
  }
  
}


