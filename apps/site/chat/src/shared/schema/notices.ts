import { pgTable, text, serial, numeric, jsonb, integer } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const notices = pgTable('notices', {
  id: serial('id').primaryKey(),
  uuid: text('uuid'),
  naid: text('naid'),
  targetAid: text('target_aid'),
  title: text('title'),
  isRead: integer('is_read').default(0),
  typeName: text('type_name'),
  order: numeric('order').default('0'),
  xaid: text('xaid'),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`now()`),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
  deletedAt: numeric('deleted_at'),
  dataIn: jsonb('data_in'),
})


