import { browser } from '$app/environment';

const STORAGE_KEY = 'paydown_debts';

export type DebtType =
  | 'credit-card'
  | 'car'
  | 'mortgage'
  | 'student-loan'
  | 'personal-loan'
  | 'other';

export interface PaydownDebt {
  id: string;
  name: string;
  type: DebtType;
  amount: number; // Debt amount
  interestRate: number; // Interest rate as percentage (e.g., 4.25 for 4.25%)
  monthlyPayment: number; // Monthly payment amount
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Get all debts from localStorage
 */
export function getAllDebts(): PaydownDebt[] {
  if (!browser) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as PaydownDebt[];
  } catch (error) {
    console.error('Error reading debts from localStorage:', error);
    return [];
  }
}

/**
 * Get a single debt by ID
 */
export function getDebtById(id: string): PaydownDebt | null {
  const debts = getAllDebts();
  return debts.find((debt) => debt.id === id) || null;
}

/**
 * Add a new debt to localStorage
 */
export function addDebt(debt: Omit<PaydownDebt, 'id' | 'createdAt' | 'updatedAt'>): PaydownDebt {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const debts = getAllDebts();
  const newDebt: PaydownDebt = {
    ...debt,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  debts.push(newDebt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(debts));
  return newDebt;
}

/**
 * Update an existing debt
 */
export function updateDebt(
  id: string,
  updates: Partial<Omit<PaydownDebt, 'id' | 'createdAt'>>,
): PaydownDebt | null {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const debts = getAllDebts();
  const index = debts.findIndex((debt) => debt.id === id);

  if (index === -1) {
    return null;
  }

  const updatedDebt: PaydownDebt = {
    ...debts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  debts[index] = updatedDebt;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(debts));
  return updatedDebt;
}

/**
 * Delete a debt by ID
 */
export function deleteDebt(id: string): boolean {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const debts = getAllDebts();
  const filtered = debts.filter((debt) => debt.id !== id);

  if (filtered.length === debts.length) {
    return false; // Debt not found
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Clear all debts from localStorage
 */
export function clearAllDebts(): void {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get the count of debts
 */
export function getDebtCount(): number {
  return getAllDebts().length;
}

// ============================================================================
// INCOMES
// ============================================================================

const INCOME_STORAGE_KEY = 'paydown_incomes';

export interface MonthlyIncome {
  id: string;
  title: string;
  amount: number; // Monthly income amount
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Get all incomes from localStorage
 */
export function getAllIncomes(): MonthlyIncome[] {
  if (!browser) return [];

  try {
    const stored = localStorage.getItem(INCOME_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as MonthlyIncome[];
  } catch (error) {
    console.error('Error reading incomes from localStorage:', error);
    return [];
  }
}

/**
 * Get a single income by ID
 */
export function getIncomeById(id: string): MonthlyIncome | null {
  const incomes = getAllIncomes();
  return incomes.find((income) => income.id === id) || null;
}

/**
 * Add a new income to localStorage
 */
export function addIncome(
  income: Omit<MonthlyIncome, 'id' | 'createdAt' | 'updatedAt'>,
): MonthlyIncome {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const incomes = getAllIncomes();
  const newIncome: MonthlyIncome = {
    ...income,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  incomes.push(newIncome);
  localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(incomes));
  return newIncome;
}

/**
 * Update an existing income
 */
export function updateIncome(
  id: string,
  updates: Partial<Omit<MonthlyIncome, 'id' | 'createdAt'>>,
): MonthlyIncome | null {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const incomes = getAllIncomes();
  const index = incomes.findIndex((income) => income.id === id);

  if (index === -1) {
    return null;
  }

  const updatedIncome: MonthlyIncome = {
    ...incomes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  incomes[index] = updatedIncome;
  localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(incomes));
  return updatedIncome;
}

/**
 * Delete an income by ID
 */
export function deleteIncome(id: string): boolean {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const incomes = getAllIncomes();
  const filtered = incomes.filter((income) => income.id !== id);

  if (filtered.length === incomes.length) {
    return false; // Income not found
  }

  localStorage.setItem(INCOME_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Clear all incomes from localStorage
 */
export function clearAllIncomes(): void {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  localStorage.removeItem(INCOME_STORAGE_KEY);
}

/**
 * Get the count of incomes
 */
export function getIncomeCount(): number {
  return getAllIncomes().length;
}

// ============================================================================
// RECURRING EXPENSES
// ============================================================================

const RECURRING_EXPENSE_STORAGE_KEY = 'paydown_recurring_expenses';

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number; // Monthly expense amount
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Get all recurring expenses from localStorage
 */
export function getAllRecurringExpenses(): RecurringExpense[] {
  if (!browser) return [];

  try {
    const stored = localStorage.getItem(RECURRING_EXPENSE_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as RecurringExpense[];
  } catch (error) {
    console.error('Error reading recurring expenses from localStorage:', error);
    return [];
  }
}

/**
 * Get a single recurring expense by ID
 */
export function getRecurringExpenseById(id: string): RecurringExpense | null {
  const expenses = getAllRecurringExpenses();
  return expenses.find((expense) => expense.id === id) || null;
}

/**
 * Add a new recurring expense to localStorage
 */
export function addRecurringExpense(
  expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>,
): RecurringExpense {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const expenses = getAllRecurringExpenses();
  const newExpense: RecurringExpense = {
    ...expense,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  expenses.push(newExpense);
  localStorage.setItem(RECURRING_EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
  return newExpense;
}

/**
 * Update an existing recurring expense
 */
export function updateRecurringExpense(
  id: string,
  updates: Partial<Omit<RecurringExpense, 'id' | 'createdAt'>>,
): RecurringExpense | null {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const expenses = getAllRecurringExpenses();
  const index = expenses.findIndex((expense) => expense.id === id);

  if (index === -1) {
    return null;
  }

  const updatedExpense: RecurringExpense = {
    ...expenses[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  expenses[index] = updatedExpense;
  localStorage.setItem(RECURRING_EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
  return updatedExpense;
}

/**
 * Delete a recurring expense by ID
 */
export function deleteRecurringExpense(id: string): boolean {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const expenses = getAllRecurringExpenses();
  const filtered = expenses.filter((expense) => expense.id !== id);

  if (filtered.length === expenses.length) {
    return false; // Expense not found
  }

  localStorage.setItem(RECURRING_EXPENSE_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Clear all recurring expenses from localStorage
 */
export function clearAllRecurringExpenses(): void {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  localStorage.removeItem(RECURRING_EXPENSE_STORAGE_KEY);
}

/**
 * Get the count of recurring expenses
 */
export function getRecurringExpenseCount(): number {
  return getAllRecurringExpenses().length;
}
