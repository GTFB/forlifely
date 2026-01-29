import { pgTable, serial, integer, text, jsonb } from 'drizzle-orm/pg-core'

export const journals = pgTable('journals', {
    id: serial('id').primaryKey(),
    user_id: integer('user_id'),
    uuid: text('uuid').notNull(),
    details: jsonb('details').notNull(),
    action: text('action').notNull(),
    xaid: text('xaid'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
})

