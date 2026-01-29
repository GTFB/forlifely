import { pgTable, text, serial, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const messageThreads = pgTable('message_threads', {
  id: serial('id').primaryKey(),
  uuid: text('uuid').notNull(),
  maid: text('maid').notNull(),
  parentMaid: text('parent_maid'),
  title: text('title'),
  statusName: text('status_name'),
  type: text('type'),
  order: numeric('order').default('0'),
  xaid: text('xaid'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  gin: jsonb('gin'),
  dataIn: jsonb('data_in'),
  value: text('value'), // Added in migration 20251029_135641
})

