import { sqliteTable, text, integer, numeric } from 'drizzle-orm/sqlite-core'

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uuid: text('uuid'),
  attribute: text('attribute').notNull(),
  value: text('value'),
  type: text('type'),
  order: numeric('order').default('0'),
  xaid: text('xaid'),
  createdAt: text('created_at')
    .notNull()
    .default("(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"),
  updatedAt: text('updated_at')
    .notNull()
    .default("(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"),
  dataIn: text('data_in', { mode: 'json' }),
})


