// Re-export all tables
export * from './users';
export * from './budgets';
export * from './auth';

// Re-export types
export type { Budget, Category, BudgetItem } from './budgets';

// Composite types
import type { Budget, Category, BudgetItem } from './budgets';

export type BudgetWithRelations = Budget & {
  categories: Category[];
  budgetItems: BudgetItem[];
};
