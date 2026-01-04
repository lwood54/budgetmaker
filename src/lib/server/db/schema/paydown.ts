import { sql, type InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users';

// Debt type enum values
export type DebtType =
  | 'credit-card'
  | 'car'
  | 'mortgage'
  | 'student-loan'
  | 'personal-loan'
  | 'other';

export const paydownScenarios = sqliteTable('paydown_scenarios', {
  uuid: text().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.uuid, { onDelete: 'cascade' }),
  name: text().notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const paydownDebts = sqliteTable('paydown_debts', {
  uuid: text().primaryKey(),
  scenarioId: text('scenario_id')
    .notNull()
    .references(() => paydownScenarios.uuid, { onDelete: 'cascade' }),
  name: text().notNull(),
  type: text('type').notNull(), // DebtType as text
  amount: integer('amount').notNull(), // Stored as cents (10000 = $100.00)
  interestRate: integer('interest_rate').notNull(), // Stored as basis points (425 = 4.25%)
  monthlyPayment: integer('monthly_payment').notNull(), // Stored as cents (10000 = $100.00)
  priority: integer('priority').notNull().default(1), // Priority for snowball (1 = highest, 0 = skip)
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const paydownIncomes = sqliteTable('paydown_incomes', {
  uuid: text().primaryKey(),
  scenarioId: text('scenario_id')
    .notNull()
    .references(() => paydownScenarios.uuid, { onDelete: 'cascade' }),
  title: text().notNull(),
  amount: integer('amount').notNull(), // Stored as cents (10000 = $100.00)
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const paydownRecurringExpenses = sqliteTable('paydown_recurring_expenses', {
  uuid: text().primaryKey(),
  scenarioId: text('scenario_id')
    .notNull()
    .references(() => paydownScenarios.uuid, { onDelete: 'cascade' }),
  title: text().notNull(),
  amount: integer('amount').notNull(), // Stored as cents (10000 = $100.00)
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const paydownSavedPlans = sqliteTable('paydown_saved_plans', {
  uuid: text().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.uuid, { onDelete: 'cascade' }),
  name: text().notNull(),
  scenarioId: text('scenario_id').references(() => paydownScenarios.uuid, {
    onDelete: 'set null',
  }), // Nullable reference to scenario
  planStartDate: text('plan_start_date', { mode: 'text' }).notNull(), // ISO date string
  yearsToPlan: integer('years_to_plan').notNull(),
  additionalSnowball: integer('additional_snowball').notNull(), // Stored as cents (10000 = $100.00)
  // JSON fields for complex data
  paymentPlan: text('payment_plan', { mode: 'json' }).notNull(), // MonthlyPaymentPlan[]
  manuallyEditedPayments: text('manually_edited_payments', { mode: 'json' }).notNull(), // Record<number, Record<string, number>>
  manuallyEditedIncomes: text('manually_edited_incomes', { mode: 'json' }).notNull(), // Record<number, Record<string, number>>
  manuallyEditedRecurringExpenses: text('manually_edited_recurring_expenses', {
    mode: 'json',
  }).notNull(), // Record<number, Record<string, number>>
  debts: text('debts', { mode: 'json' }).notNull(), // PaydownDebt[]
  incomes: text('incomes', { mode: 'json' }).notNull(), // MonthlyIncome[]
  recurringExpenses: text('recurring_expenses', { mode: 'json' }).notNull(), // RecurringExpense[]
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Type exports
export type PaydownScenario = InferSelectModel<typeof paydownScenarios>;
export type PaydownDebt = InferSelectModel<typeof paydownDebts>;
export type PaydownIncome = InferSelectModel<typeof paydownIncomes>;
export type PaydownRecurringExpense = InferSelectModel<typeof paydownRecurringExpenses>;
export type PaydownSavedPlan = InferSelectModel<typeof paydownSavedPlans>;
