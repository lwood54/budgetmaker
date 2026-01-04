// Re-export all tables
export * from './users';
export * from './budgets';
export * from './auth';
export * from './paydown';

// Re-export types
export type { Budget, Category, BudgetItem } from './budgets';
export type {
  PaydownScenario,
  PaydownDebt,
  PaydownIncome,
  PaydownRecurringExpense,
  PaydownSavedPlan,
  DebtType,
} from './paydown';

// Composite types
import type { Budget, Category, BudgetItem } from './budgets';
import type {
  PaydownScenario,
  PaydownDebt,
  PaydownIncome,
  PaydownRecurringExpense,
} from './paydown';

export type BudgetWithRelations = Budget & {
  categories: Category[];
  budgetItems: BudgetItem[];
};

export type PaydownScenarioWithRelations = PaydownScenario & {
  debts: PaydownDebt[];
  incomes: PaydownIncome[];
  recurringExpenses: PaydownRecurringExpense[];
};
