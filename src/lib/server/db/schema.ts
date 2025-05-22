import { sql, type InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const budgets = sqliteTable('budgets', {
	uuid: text().primaryKey(),
	name: text().notNull(),
	createdAt: text('created_at', { mode: 'text' })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text('updated_at', { mode: 'text' })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
});

export type Budget = InferSelectModel<typeof budgets>;
