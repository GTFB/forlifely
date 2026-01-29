import { pgTable, text, serial, numeric, jsonb } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const outreaches = pgTable('outreaches', {
  id: serial('id').primaryKey(),
  uuid: text('uuid').notNull(),
  oaid: text('oaid').notNull(),
  said: text('said'),
  title: text('title'),
  strategyType: text('strategy_type'),
  mechanicType: text('mechanic_type'),
  order: numeric('order').default('0'),
  xaid: text('xaid'),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`now()`),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
  deletedAt: numeric('deleted_at'),
  gin: jsonb('gin'),
  fts: text('fts'),
  dataIn: jsonb('data_in'),
  dataOut: jsonb('data_out'),
})

