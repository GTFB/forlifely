import { sqliteTable, text, integer, numeric } from 'drizzle-orm/sqlite-core'

export const goals = sqliteTable('goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uuid: text('uuid').notNull(),
  gaid: text('gaid').notNull(),
  fullGaid: text('full_gaid'),
  parentFullGaid: text('parent_full_gaid'),
  title: text('title'),
  cycle: text('cycle'),
  type: text('type'),
  statusName: text('status_name'),
  order: numeric('order').default('0'),
  isPublic: integer('is_public').default(1),
  xaid: text('xaid'),
  updatedAt: text('updated_at')
    .notNull()
    .default("(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"),
  createdAt: text('created_at')
    .notNull()
    .default("(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"),
  deletedAt: numeric('deleted_at'),
  gin: text('gin', { mode: 'json' }),
  fts: text('fts', { mode: 'json' }),
  dataIn: text('data_in', { mode: 'json' }),
  dataOut: text('data_out', { mode: 'json' }),
})


