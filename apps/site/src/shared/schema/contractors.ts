import { pgTable, text, serial, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const contractors = pgTable('contractors', {
	id: serial('id').primaryKey(),
	uuid: text('uuid').notNull(),
	caid: text('caid').notNull(),
	title: text('title').notNull(),
	reg: text('reg'),
	tin: text('tin'),
	statusName: text('status_name'),
	type: text('type'),
	cityName: text('city_name'),
	order: numeric('order').default('0'),
	xaid: text('xaid'),
	mediaId: text('media_id'),
	updatedAt: text('updated_at').notNull().default(sql`now()`),
	createdAt: text('created_at').notNull().default(sql`now()`),
	deletedAt: numeric('deleted_at'),
	gin: jsonb('gin'),
	fts: jsonb('fts'),
	dataIn: jsonb('data_in'),
	dataOut: jsonb('data_out'),
});

