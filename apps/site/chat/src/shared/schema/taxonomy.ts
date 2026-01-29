import { pgTable, text, serial, numeric } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const taxonomy = pgTable('taxonomy', {
  id: serial('id').primaryKey(),
  entity: text('entity').notNull(),
  name: text('name').notNull(),
  title: text('title'),
  sortOrder: numeric('sort_order').default('0'),
  createdAt: text('created_at').notNull().default(sql`now()`),
  updatedAt: text('updated_at').notNull().default(sql`now()`),
  deletedAt: numeric('deleted_at'),
})


