import { sql, type InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const budgets = sqliteTable('budgets', {
  uuid: text().primaryKey(),
  name: text().notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.uuid, { onDelete: 'cascade' }),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const categories = sqliteTable('categories', {
  budgetId: text('budget_id')
    .notNull()
    .references(() => budgets.uuid, { onDelete: 'cascade' }),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  name: text().notNull(),
  limit: integer('limit').notNull(), // 100 === $1.00
  uuid: text().primaryKey(),
});

export const budgetItems = sqliteTable('budget_items', {
  amount: integer('amount').notNull(), // 100 === $1.00
  budgetId: text('budget_id')
    .notNull()
    .references(() => budgets.uuid, { onDelete: 'cascade' }),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.uuid, { onDelete: 'cascade' }),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  purchaseDate: text('purchase_date', { mode: 'text' }).notNull(),
  uuid: text().primaryKey(),
  name: text().notNull(),
});

export type Budget = InferSelectModel<typeof budgets>;
export type Category = InferSelectModel<typeof categories>;
export type BudgetItem = InferSelectModel<typeof budgetItems>;
