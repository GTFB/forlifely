import { pgTable, text, serial, numeric, boolean, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const products = pgTable('products', {
	id: serial('id').primaryKey(),
	uuid: text('uuid').notNull(),
	paid: text('paid').notNull(),
	title: text('title'),
	category: text('category'),
	type: text('type'),
	statusName: text('status_name'),
	isPublic: boolean('is_public').default(true),
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

