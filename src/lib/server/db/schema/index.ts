// Re-export all tables
export * from './users';
export * from './budgets';
export * from './auth';
export * from './projections';

// Re-export types
export type { Budget, Category, BudgetItem } from './budgets';
export type {
  Projection,
  Section,
  Interval,
  GroupItem,
  IntervalBalance,
  PaydownStrategy,
  GroupItemType,
} from './projections';

// Composite types
import type { Budget, Category, BudgetItem } from './budgets';
import type { Projection, Section, Interval, GroupItem, IntervalBalance } from './projections';

export type BudgetWithRelations = Budget & {
  categories: Category[];
  budgetItems: BudgetItem[];
};

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
