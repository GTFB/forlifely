import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

export const journals = sqliteTable('journals', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    user_id: integer('user_id'),
    uuid: text('uuid').notNull(),
    details: text('details', { mode: 'json' }).notNull(),
    action: text('action').notNull(),
    xaid: text('xaid'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
})

