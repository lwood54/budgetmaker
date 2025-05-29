import { sql, type InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

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

export const users = sqliteTable('users', {
  uuid: text().primaryKey(),
  email: text().notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable('sessions', {
  uuid: text().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.uuid, { onDelete: 'cascade' }),
  token: text().notNull(),
  expiresAt: text('expires_at', { mode: 'text' }).notNull(),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  uuid: text().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.uuid, { onDelete: 'cascade' }),
  token: text().notNull().unique(),
  expiresAt: text('expires_at', { mode: 'text' }).notNull(),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  uuid: text().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.uuid, { onDelete: 'cascade' }),
  token: text().notNull().unique(),
  expiresAt: text('expires_at', { mode: 'text' }).notNull(),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Add relations
export const budgetsRelations = relations(budgets, ({ many }) => ({
  categories: many(categories),
  budgetItems: many(budgetItems),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  budget: one(budgets, {
    fields: [categories.budgetId],
    references: [budgets.uuid],
  }),
  budgetItems: many(budgetItems),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetItems.budgetId],
    references: [budgets.uuid],
  }),
  category: one(categories, {
    fields: [budgetItems.categoryId],
    references: [categories.uuid],
  }),
}));

export type Budget = InferSelectModel<typeof budgets>;
export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type PasswordResetToken = InferSelectModel<typeof passwordResetTokens>;
export type EmailVerificationToken = InferSelectModel<typeof emailVerificationTokens>;
export type Category = InferSelectModel<typeof categories>;
export type BudgetItem = InferSelectModel<typeof budgetItems>;

// New type for budget with relations
export type BudgetWithRelations = Budget & {
  categories: Category[];
  budgetItems: BudgetItem[];
};
