import { browser } from '$app/environment';

// ============================================================================
// SCENARIOS (formerly called "setups")
// ============================================================================

const SCENARIOS_STORAGE_KEY = 'paydown_scenarios';
const ACTIVE_SCENARIO_KEY = 'paydown_active_scenario';
const MAX_SCENARIOS = 5;

export interface PaydownScenario {
  id: string;
  name: string;
  debts: PaydownDebt[];
  incomes: MonthlyIncome[];
  recurringExpenses: RecurringExpense[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Get all scenarios from localStorage
 */
export function getAllScenarios(): PaydownScenario[] {
  if (!browser) return [];

  try {
    const stored = localStorage.getItem(SCENARIOS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as PaydownScenario[];
  } catch (error) {
    console.error('Error reading scenarios from localStorage:', error);
    return [];
  }
}

/**
 * Get a scenario by ID
 */
export function getScenarioById(id: string): PaydownScenario | null {
  const scenarios = getAllScenarios();
  return scenarios.find((scenario) => scenario.id === id) || null;
}

/**
 * Get the active scenario ID
 */
export function getActiveScenarioId(): string | null {
  if (!browser) return null;

  try {
    return localStorage.getItem(ACTIVE_SCENARIO_KEY);
  } catch (error) {
    console.error('Error reading active scenario from localStorage:', error);
    return null;
  }
}

/**
 * Set the active scenario ID
 */
export function setActiveScenarioId(id: string | null): void {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  if (id === null) {
    localStorage.removeItem(ACTIVE_SCENARIO_KEY);
  } else {
    localStorage.setItem(ACTIVE_SCENARIO_KEY, id);
  }
}

/**
 * Get the active scenario
 */
export function getActiveScenario(): PaydownScenario | null {
  const activeId = getActiveScenarioId();
  if (!activeId) return null;
  return getScenarioById(activeId);
}

/**
 * Create a new scenario
 */
export function createScenario(name: string): PaydownScenario {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const scenarios = getAllScenarios();

  // Check max scenarios limit
  if (scenarios.length >= MAX_SCENARIOS) {
    throw new Error(`Maximum of ${MAX_SCENARIOS} scenarios allowed`);
  }

  const newScenario: PaydownScenario = {
    id: crypto.randomUUID(),
    name: name.trim() || 'Untitled Scenario',
    debts: [],
    incomes: [],
    recurringExpenses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  scenarios.push(newScenario);
  localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));

  // Set as active if it's the first scenario
  if (scenarios.length === 1) {
    setActiveScenarioId(newScenario.id);
  }

  return newScenario;
}

/**
 * Update a scenario
 */
export function updateScenario(
  id: string,
  updates: Partial<Omit<PaydownScenario, 'id' | 'createdAt'>>,
): PaydownScenario | null {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const scenarios = getAllScenarios();
  const index = scenarios.findIndex((scenario) => scenario.id === id);

  if (index === -1) {
    return null;
  }

  const updatedScenario: PaydownScenario = {
    ...scenarios[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  scenarios[index] = updatedScenario;
  localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
  return updatedScenario;
}

/**
 * Delete a scenario
 */
export function deleteScenario(id: string): boolean {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const scenarios = getAllScenarios();
  const filtered = scenarios.filter((scenario) => scenario.id !== id);

  if (filtered.length === scenarios.length) {
    return false; // Scenario not found
  }

  localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(filtered));

  // If deleted scenario was active, set first scenario as active (or null if none)
  const activeId = getActiveScenarioId();
  if (activeId === id) {
    if (filtered.length > 0) {
      setActiveScenarioId(filtered[0].id);
    } else {
      setActiveScenarioId(null);
    }
  }

  return true;
}

/**
 * Migrate old localStorage format to scenarios format
 * This runs once to convert existing data to a default scenario
 */
function migrateToScenarios(): void {
  if (!browser) return;

  // Check if migration already happened (scenarios exist)
  const scenarios = getAllScenarios();
  if (scenarios.length > 0) return;

  // Check if old format data exists
  const oldDebts = localStorage.getItem('paydown_debts');
  const oldIncomes = localStorage.getItem('paydown_incomes');
  const oldExpenses = localStorage.getItem('paydown_recurring_expenses');

  // If no old data exists, create empty default scenario
  if (!oldDebts && !oldIncomes && !oldExpenses) {
    createScenario('Default Scenario');
    return;
  }

  // Migrate old data to a default scenario
  try {
    const debts: PaydownDebt[] = oldDebts ? JSON.parse(oldDebts) : [];
    const incomes: MonthlyIncome[] = oldIncomes ? JSON.parse(oldIncomes) : [];
    const expenses: RecurringExpense[] = oldExpenses ? JSON.parse(oldExpenses) : [];

    const defaultScenario: PaydownScenario = {
      id: crypto.randomUUID(),
      name: 'Default Scenario',
      debts,
      incomes,
      recurringExpenses: expenses,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify([defaultScenario]));
    setActiveScenarioId(defaultScenario.id);

    // Optionally clear old keys (commented out for safety - can uncomment after testing)
    // localStorage.removeItem('paydown_debts');
    // localStorage.removeItem('paydown_incomes');
    // localStorage.removeItem('paydown_recurring_expenses');
  } catch (error) {
    console.error('Error migrating to scenarios:', error);
    // Create empty default scenario as fallback
    createScenario('Default Scenario');
  }
}

// Run migration on module load
if (browser) {
  migrateToScenarios();
}

// ============================================================================
// DEBTS
// ============================================================================

const STORAGE_KEY = 'paydown_debts'; // Kept for backward compatibility during migration

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
  priority: number; // Priority for snowball (1 = highest, 0 = skip)
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Get all debts from the active scenario
 */
export function getAllDebts(): PaydownDebt[] {
  if (!browser) return [];

  const activeScenario = getActiveScenario();
  if (activeScenario) {
    return activeScenario.debts;
  }

  // Fallback to old format during migration
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
 * Add a new debt to the active scenario
 */
export function addDebt(debt: Omit<PaydownDebt, 'id' | 'createdAt' | 'updatedAt'>): PaydownDebt {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const activeScenario = getActiveScenario();
  if (activeScenario) {
    const newDebt: PaydownDebt = {
      ...debt,
      priority: debt.priority ?? 1, // Default to 1 (highest priority) if not provided
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    activeScenario.debts.push(newDebt);
    updateScenario(activeScenario.id, { debts: activeScenario.debts });
    return newDebt;
  }

  // Fallback to old format during migration
  const debts = getAllDebts();
  const newDebt: PaydownDebt = {
    ...debt,
    priority: debt.priority ?? 1,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  debts.push(newDebt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(debts));
  return newDebt;
}

/**
 * Update an existing debt in the active scenario
 */
export function updateDebt(
  id: string,
  updates: Partial<Omit<PaydownDebt, 'id' | 'createdAt'>>,
): PaydownDebt | null {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const activeScenario = getActiveScenario();
  if (activeScenario) {
    const index = activeScenario.debts.findIndex((debt) => debt.id === id);
    if (index === -1) {
      return null;
    }

    const updatedDebt: PaydownDebt = {
      ...activeScenario.debts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    activeScenario.debts[index] = updatedDebt;
    updateScenario(activeScenario.id, { debts: activeScenario.debts });
    return updatedDebt;
  }

  // Fallback to old format during migration
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
 * Delete a debt by ID from the active scenario
 */
export function deleteDebt(id: string): boolean {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const activeScenario = getActiveScenario();
  if (activeScenario) {
    const filtered = activeScenario.debts.filter((debt) => debt.id !== id);
    if (filtered.length === activeScenario.debts.length) {
      return false; // Debt not found
    }

    updateScenario(activeScenario.id, { debts: filtered });
    return true;
  }

  // Fallback to old format during migration
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
 * Get all incomes from the active scenario
 */
export function getAllIncomes(): MonthlyIncome[] {
  if (!browser) return [];

  const activeScenario = getActiveScenario();
  if (activeScenario) {
    return activeScenario.incomes;
  }

  // Fallback to old format during migration
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
 * Add a new income to the active scenario
 */
export function addIncome(
  income: Omit<MonthlyIncome, 'id' | 'createdAt' | 'updatedAt'>,
): MonthlyIncome {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const activeScenario = getActiveScenario();
  if (activeScenario) {
    const newIncome: MonthlyIncome = {
      ...income,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    activeScenario.incomes.push(newIncome);
    updateScenario(activeScenario.id, { incomes: activeScenario.incomes });
    return newIncome;
  }

  // Fallback to old format during migration
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
 * Update an existing income in the active scenario
 */
export function updateIncome(
  id: string,
  updates: Partial<Omit<MonthlyIncome, 'id' | 'createdAt'>>,
): MonthlyIncome | null {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const activeScenario = getActiveScenario();
  if (activeScenario) {
    const index = activeScenario.incomes.findIndex((income) => income.id === id);
    if (index === -1) {
      return null;
    }

    const updatedIncome: MonthlyIncome = {
      ...activeScenario.incomes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    activeScenario.incomes[index] = updatedIncome;
    updateScenario(activeScenario.id, { incomes: activeScenario.incomes });
    return updatedIncome;
  }

  // Fallback to old format during migration
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
 * Delete an income by ID from the active scenario
 */
export function deleteIncome(id: string): boolean {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const activeScenario = getActiveScenario();
  if (activeScenario) {
    const filtered = activeScenario.incomes.filter((income) => income.id !== id);
    if (filtered.length === activeScenario.incomes.length) {
      return false; // Income not found
    }

    updateScenario(activeScenario.id, { incomes: filtered });
    return true;
  }

  // Fallback to old format during migration
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
 * Get all recurring expenses from the active scenario
 */
export function getAllRecurringExpenses(): RecurringExpense[] {
  if (!browser) return [];

  const activeScenario = getActiveScenario();
  if (activeScenario) {
    return activeScenario.recurringExpenses;
  }

  // Fallback to old format during migration
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
 * Add a new recurring expense to the active scenario
 */
export function addRecurringExpense(
  expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt'>,
): RecurringExpense {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const activeScenario = getActiveScenario();
  if (activeScenario) {
    const newExpense: RecurringExpense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    activeScenario.recurringExpenses.push(newExpense);
    updateScenario(activeScenario.id, { recurringExpenses: activeScenario.recurringExpenses });
    return newExpense;
  }

  // Fallback to old format during migration
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
 * Update an existing recurring expense in the active scenario
 */
export function updateRecurringExpense(
  id: string,
  updates: Partial<Omit<RecurringExpense, 'id' | 'createdAt'>>,
): RecurringExpense | null {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const activeScenario = getActiveScenario();
  if (activeScenario) {
    const index = activeScenario.recurringExpenses.findIndex((expense) => expense.id === id);
    if (index === -1) {
      return null;
    }

    const updatedExpense: RecurringExpense = {
      ...activeScenario.recurringExpenses[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    activeScenario.recurringExpenses[index] = updatedExpense;
    updateScenario(activeScenario.id, {
      recurringExpenses: activeScenario.recurringExpenses,
    });
    return updatedExpense;
  }

  // Fallback to old format during migration
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
 * Delete a recurring expense by ID from the active scenario
 */
export function deleteRecurringExpense(id: string): boolean {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const activeScenario = getActiveScenario();
  if (activeScenario) {
    const filtered = activeScenario.recurringExpenses.filter((expense) => expense.id !== id);
    if (filtered.length === activeScenario.recurringExpenses.length) {
      return false; // Expense not found
    }

    updateScenario(activeScenario.id, { recurringExpenses: filtered });
    return true;
  }

  // Fallback to old format during migration
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

// ============================================================================
// SAVED PLANS
// ============================================================================

const SAVED_PLANS_STORAGE_KEY = 'paydown_saved_plans';
const MAX_SAVED_PLANS = 5;

import type { MonthlyPaymentPlan } from './paydownPlan';

export interface SavedPlan {
  id: string;
  name: string;
  // Base scenario inputs
  debts: PaydownDebt[];
  incomes: MonthlyIncome[];
  recurringExpenses: RecurringExpense[];
  // Plan generation parameters
  planStartDate: string; // ISO date string
  yearsToPlan: number;
  additionalSnowball: number;
  // Generated plan data
  paymentPlan: MonthlyPaymentPlan[];
  // Manual edits
  manuallyEditedPayments: Record<number, Record<string, number>>;
  manuallyEditedIncomes: Record<number, Record<string, number>>;
  manuallyEditedRecurringExpenses: Record<number, Record<string, number>>;
  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Get all saved plans from localStorage
 */
export function getAllSavedPlans(): SavedPlan[] {
  if (!browser) return [];

  try {
    const stored = localStorage.getItem(SAVED_PLANS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SavedPlan[];
  } catch (error) {
    console.error('Error reading saved plans from localStorage:', error);
    return [];
  }
}

/**
 * Get a saved plan by ID
 */
export function getSavedPlanById(id: string): SavedPlan | null {
  const plans = getAllSavedPlans();
  return plans.find((plan) => plan.id === id) || null;
}

/**
 * Create a new saved plan
 */
export function createSavedPlan(
  name: string,
  planData: {
    debts: PaydownDebt[];
    incomes: MonthlyIncome[];
    recurringExpenses: RecurringExpense[];
    planStartDate: Date;
    yearsToPlan: number;
    additionalSnowball: number;
    paymentPlan: MonthlyPaymentPlan[];
    manuallyEditedPayments: Record<number, Record<string, number>>;
    manuallyEditedIncomes: Record<number, Record<string, number>>;
    manuallyEditedRecurringExpenses: Record<number, Record<string, number>>;
  },
): SavedPlan {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const plans = getAllSavedPlans();

  // Check max plans limit
  if (plans.length >= MAX_SAVED_PLANS) {
    throw new Error(`Maximum of ${MAX_SAVED_PLANS} saved plans allowed`);
  }

  const newPlan: SavedPlan = {
    id: crypto.randomUUID(),
    name: name.trim() || 'Untitled Plan',
    debts: planData.debts,
    incomes: planData.incomes,
    recurringExpenses: planData.recurringExpenses,
    planStartDate: planData.planStartDate.toISOString(),
    yearsToPlan: planData.yearsToPlan,
    additionalSnowball: planData.additionalSnowball,
    paymentPlan: planData.paymentPlan,
    manuallyEditedPayments: planData.manuallyEditedPayments,
    manuallyEditedIncomes: planData.manuallyEditedIncomes,
    manuallyEditedRecurringExpenses: planData.manuallyEditedRecurringExpenses,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  plans.push(newPlan);
  localStorage.setItem(SAVED_PLANS_STORAGE_KEY, JSON.stringify(plans));

  return newPlan;
}

/**
 * Update a saved plan
 */
export function updateSavedPlan(
  id: string,
  updates: Partial<
    Omit<
      SavedPlan,
      'id' | 'createdAt' | 'name' | 'planStartDate' | 'yearsToPlan' | 'additionalSnowball'
    >
  > & {
    planStartDate?: Date;
    yearsToPlan?: number;
    additionalSnowball?: number;
    name?: string;
  },
): SavedPlan | null {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const plans = getAllSavedPlans();
  const index = plans.findIndex((plan) => plan.id === id);

  if (index === -1) {
    return null;
  }

  const planStartDateValue = updates.planStartDate
    ? updates.planStartDate instanceof Date
      ? updates.planStartDate.toISOString()
      : typeof updates.planStartDate === 'string'
        ? updates.planStartDate
        : plans[index].planStartDate
    : plans[index].planStartDate;

  const updatedPlan: SavedPlan = {
    ...plans[index],
    ...updates,
    planStartDate: planStartDateValue,
    updatedAt: new Date().toISOString(),
  };

  plans[index] = updatedPlan;
  localStorage.setItem(SAVED_PLANS_STORAGE_KEY, JSON.stringify(plans));
  return updatedPlan;
}

/**
 * Delete a saved plan
 */
export function deleteSavedPlan(id: string): boolean {
  if (!browser) {
    throw new Error('localStorage is only available in the browser');
  }

  const plans = getAllSavedPlans();
  const filtered = plans.filter((plan) => plan.id !== id);

  if (filtered.length === plans.length) {
    return false; // Plan not found
  }

  localStorage.setItem(SAVED_PLANS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}
