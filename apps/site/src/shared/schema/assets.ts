import { pgTable, text, serial, numeric, jsonb } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  uuid: text('uuid').notNull(),
  aaid: text('aaid').notNull(),
  ownerAid: text('owner_aid'),
  number: text('number'),
  title: text('title'),
  url: text('url'),
  typeName: text('type_name'),
  statusName: text('status_name'),
  version: text('version'),
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


