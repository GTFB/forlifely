import { pgTable, text, serial, numeric, jsonb } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  uuid: text('uuid').notNull(),
  eaid: text('eaid'),
  fullEaid: text('full_eaid'),
  haid: text('haid'),
  statusName: text('status_name'),
  email: text('email'),
  order: numeric('order').default('0'),
  xaid: text('xaid'),
  updatedAt: text('updated_at').notNull().default(sql`now()`),
  createdAt: text('created_at').notNull().default(sql`now()`),
  deletedAt: numeric('deleted_at'),
  gin: jsonb('gin'),
  fts: jsonb('fts'),
  dataIn: jsonb('data_in'),
  dataOut: jsonb('data_out'),
})