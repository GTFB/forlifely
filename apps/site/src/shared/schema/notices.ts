import { sqliteTable, text, integer, numeric } from 'drizzle-orm/sqlite-core'

export const notices = sqliteTable('notices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
    .default("(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"),
  createdAt: text('created_at')
    .notNull()
    .default("(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"),
  deletedAt: numeric('deleted_at'),
  dataIn: text('data_in', { mode: 'json' }),
})


