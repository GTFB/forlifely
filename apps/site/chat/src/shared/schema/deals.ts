import { pgTable, text, serial, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const deals = pgTable('deals', {
	id: serial('id').primaryKey(),
	uuid: text('uuid').notNull(),
	daid: text('daid').notNull(),
	fullDaid: text('full_daid'),
	clientAid: text('client_aid'),
	title: text('title'),
	cycle: text('cycle'),
	statusName: text('status_name'),
	xaid: text('xaid'),
	updatedAt: text('updated_at').notNull().default(sql`now()`),
	createdAt: text('created_at').notNull().default(sql`now()`),
	deletedAt: numeric('deleted_at'),
	gin: jsonb('gin'),
	fts: jsonb('fts'),
	dataIn: jsonb('data_in'),
	dataOut: jsonb('data_out'),
});

