import { pgTable, text, serial, numeric, jsonb } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const relations = pgTable('relations', {
  id: serial('id').primaryKey(),
  uuid: text('uuid'),
  sourceEntity: text('source_entity').notNull(),
  targetEntity: text('target_entity').notNull(),
  type: text('type'),
  statusName: text('status_name'),
  order: numeric('order').default('0'),
  xaid: text('xaid'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`now()`),
  deletedAt: numeric('deleted_at'),
  gin: jsonb('gin'),
  fts: jsonb('fts'),
  dataIn: jsonb('data_in'),
  dataOut: jsonb('data_out'),
})


