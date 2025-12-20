import { sql, type InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { users } from './users';

// Enums as TypeScript types (stored as text in SQLite)
export type PaydownStrategy =
  | 'snowball'
  | 'avalanche'
  | 'highest_balance'
  | 'lowest_balance'
  | 'custom';
export type GroupItemType = 'income' | 'transfer' | 'savings' | 'expense';

export const projections = sqliteTable('projections', {
  uuid: text().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.uuid, { onDelete: 'cascade' }),
  title: text().notNull(),
  paydownStrategy: text('paydown_strategy').notNull().$type<PaydownStrategy>(),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const sections = sqliteTable('sections', {
  uuid: text().primaryKey(),
  projectionId: text('projection_id')
    .notNull()
    .references(() => projections.uuid, { onDelete: 'cascade' }),
  title: text().notNull(),
  order: integer('order').notNull(),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const intervals = sqliteTable('intervals', {
  uuid: text().primaryKey(),
  sectionId: text('section_id')
    .notNull()
    .references(() => sections.uuid, { onDelete: 'cascade' }),
  sequence: integer('sequence').notNull(), // 1-12 representing month within the year
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const groupItems = sqliteTable('group_items', {
  uuid: text().primaryKey(),
  intervalId: text('interval_id')
    .notNull()
    .references(() => intervals.uuid, { onDelete: 'cascade' }),
  sectionName: text('section_name'), // Groups items within an interval, e.g., "Income 1", "Income 2"
  type: text().notNull().$type<GroupItemType>(),
  title: text().notNull(),
  amount: integer('amount').notNull(), // Amount in cents (100 === $1.00)
  isPaydown: integer('is_paydown', { mode: 'boolean' }).default(false),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  initialBalance: integer('initial_balance'), // In cents, only for paydown items
  interestRate: integer('interest_rate'), // In basis points (e.g., 1500 = 15.00%), only for paydown items
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const intervalBalances = sqliteTable(
  'interval_balances',
  {
    uuid: text().primaryKey(),
    intervalId: text('interval_id')
      .notNull()
      .references(() => intervals.uuid, { onDelete: 'cascade' }),
    groupItemId: text('group_item_id')
      .notNull()
      .references(() => groupItems.uuid, { onDelete: 'cascade' }),
    balance: integer('balance').notNull(), // Starting balance in cents for this paydown item in this interval
    createdAt: text('created_at', { mode: 'text' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at', { mode: 'text' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    uniqueIntervalGroupItem: unique().on(table.intervalId, table.groupItemId),
  }),
);

// TypeScript types
export type Projection = InferSelectModel<typeof projections>;
export type Section = InferSelectModel<typeof sections>;
export type Interval = InferSelectModel<typeof intervals>;
export type GroupItem = InferSelectModel<typeof groupItems>;
export type IntervalBalance = InferSelectModel<typeof intervalBalances>;

// Composite types for relations
export type ProjectionWithRelations = Projection & {
  sections: Section[];
};

export type SectionWithRelations = Section & {
  intervals: Interval[];
};

export type IntervalWithRelations = Interval & {
  groupItems: GroupItem[];
  intervalBalances: IntervalBalance[];
};

export type GroupItemWithRelations = GroupItem & {
  intervalBalances: IntervalBalance[];
};
