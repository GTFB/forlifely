import { sqliteTable, text, integer, numeric } from 'drizzle-orm/sqlite-core';
import { pgTable, serial, varchar, boolean, numeric as pgNumeric, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { isPostgres } from '../utils/db';

// SQLite schema definition
const createNoticesSqlite = () => sqliteTable('notices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uuid: text('uuid'),
  naid: text('naid'),
  targetAid: text('target_aid'),
  title: text('title'),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  typeName: text('type_name'),
  order: numeric('order').default('0'),
  xaid: text('xaid'),
  updatedAt: text('updated_at').notNull().default("(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"),
  createdAt: text('created_at').notNull().default("(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))"),
  deletedAt: numeric('deleted_at'),
  dataIn: text('data_in', {
    mode: 'json'
  }),
});

// PostgreSQL schema definition
const createNoticesPostgres = () => pgTable('notices', {
  id: serial('id').primaryKey(),
  uuid: varchar('uuid'),
  naid: varchar('naid'),
  targetAid: varchar('target_aid'),
  title: varchar('title'),
  isRead: boolean('is_read').default(false),
  typeName: varchar('type_name'),
  order: pgNumeric('order').default('0'),
  xaid: varchar('xaid'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
  dataIn: jsonb('data_in'),
});

export const notices = isPostgres() ? createNoticesPostgres() : createNoticesSqlite();

