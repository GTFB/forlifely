import { pgTable, text, serial, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const wallets = pgTable('wallets', {
	id: serial('id').primaryKey(),
	uuid: text('uuid'),
	waid: text('waid'),
	fullWaid: text('full_waid'),
	targetAid: text('target_aid'),
	title: text('title'),
	statusName: text('status_name'),
	order: numeric('order').default('0'),
	xaid: text('xaid'),
	createdAt: text('created_at').notNull().default(sql`now()`),
	updatedAt: text('updated_at').notNull().default(sql`now()`),
	deletedAt: numeric('deleted_at'),
	gin: jsonb('gin'),
	fts: jsonb('fts'),
	dataIn: jsonb('data_in'),
	dataOut: jsonb('data_out'),
});

