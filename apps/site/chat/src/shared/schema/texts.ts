import { pgTable, text, boolean, numeric, serial, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const texts = pgTable('texts', {
	id: serial('id').primaryKey(),
	uuid: text('uuid'),
	taid: text('taid'),
	title: text('title'),
	content: text('content'),
	type: text('type'),
	statusName: text('status_name'),
	isPublic: boolean('is_public').default(true),
	order: numeric('order').default('0'),
	xaid: text('xaid'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	deletedAt: timestamp('deleted_at'),
	gin: jsonb('gin'),
	fts: jsonb('fts'),
	dataIn: jsonb('data_in'),
	dataOut: jsonb('data_out'),
});
