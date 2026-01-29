import { pgTable, text, serial, numeric, boolean, jsonb } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  uuid: text('uuid').notNull(),
  raid: text('raid'),
  title: text('title'),
  name: text('name'),
  description: text('description'),
  isSystem: boolean('is_system').default(false),
  order: numeric('order').default('0'),
  xaid: text('xaid'),
  createdAt: text('created_at').notNull().default(sql`now()`),
  updatedAt: text('updated_at').notNull().default(sql`now()`),
  deletedAt: numeric('deleted_at'),
  dataIn: jsonb('data_in'),
})

