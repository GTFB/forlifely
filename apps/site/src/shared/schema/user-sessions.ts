import { pgTable, serial, integer, text } from 'drizzle-orm/pg-core'

export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  uuid: text('uuid').notNull(), // session UUID
  userId: integer('user_id').notNull(),
  userAgent: text('user_agent'),
  ip: text('ip'),
  lastSeenAt: text('last_seen_at'),
  expiresAt: text('expires_at'),
  revokedAt: text('revoked_at'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
})


