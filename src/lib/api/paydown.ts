import type { DrizzleClient } from '$lib/server/db';
import {
  paydownScenarios,
  paydownDebts,
  paydownIncomes,
  paydownRecurringExpenses,
  paydownSavedPlans,
  type DebtType,
} from '$lib/server/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { dollarsToCents, centsToDollars } from '$lib/utils/money';

// Conversion helpers
function percentageToBasisPoints(percentage: number): number {
  return Math.round(percentage * 100); // 4.25% -> 425 basis points
}

function basisPointsToPercentage(basisPoints: number): number {
  return basisPoints / 100; // 425 basis points -> 4.25%
}

// ============================================================================
// SCENARIO FUNCTIONS
// ============================================================================

export const getScenariosByUserId = async (db: DrizzleClient, userId: string) => {
  try {
    const scenarios = await db
      .select()
      .from(paydownScenarios)
      .where(eq(paydownScenarios.userId, userId))
      .orderBy(desc(paydownScenarios.createdAt));

    // For each scenario, fetch its related data
    const scenariosWithData = await Promise.all(
      scenarios.map(async (scenario) => {
        const [debts, incomes, expenses] = await Promise.all([
          db.select().from(paydownDebts).where(eq(paydownDebts.scenarioId, scenario.uuid)),
          db.select().from(paydownIncomes).where(eq(paydownIncomes.scenarioId, scenario.uuid)),
          db
            .select()
            .from(paydownRecurringExpenses)
            .where(eq(paydownRecurringExpenses.scenarioId, scenario.uuid)),
        ]);

        return {
          ...scenario,
          debts: debts.map(convertDebtFromDb),
          incomes: incomes.map(convertIncomeFromDb),
          recurringExpenses: expenses.map(convertExpenseFromDb),
        };
      }),
    );

    return scenariosWithData;
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    throw error;
  }
};

export const getScenarioById = async (db: DrizzleClient, scenarioId: string, userId: string) => {
  const [scenario] = await db
    .select()
    .from(paydownScenarios)
    .where(and(eq(paydownScenarios.uuid, scenarioId), eq(paydownScenarios.userId, userId)))
    .limit(1);

  if (!scenario) {
    return null;
  }

  const [debts, incomes, expenses] = await Promise.all([
    db.select().from(paydownDebts).where(eq(paydownDebts.scenarioId, scenarioId)),
    db.select().from(paydownIncomes).where(eq(paydownIncomes.scenarioId, scenarioId)),
    db
      .select()
      .from(paydownRecurringExpenses)
      .where(eq(paydownRecurringExpenses.scenarioId, scenarioId)),
  ]);

  return {
    ...scenario,
    debts: debts.map(convertDebtFromDb),
    incomes: incomes.map(convertIncomeFromDb),
    recurringExpenses: expenses.map(convertExpenseFromDb),
  };
};

export const getActiveScenarioId = async (db: DrizzleClient, userId: string) => {
  const [scenario] = await db
    .select()
    .from(paydownScenarios)
    .where(and(eq(paydownScenarios.userId, userId), eq(paydownScenarios.isActive, true)))
    .limit(1);

  return scenario?.uuid || null;
};

export const createScenario = async (db: DrizzleClient, userId: string, name: string) => {
  // Check max scenarios limit (5)
  const existingScenarios = await db
    .select()
    .from(paydownScenarios)
    .where(eq(paydownScenarios.userId, userId));

  if (existingScenarios.length >= 5) {
    throw new Error('Maximum of 5 scenarios allowed');
  }

  // If this is the first scenario, set it as active
  const isFirstScenario = existingScenarios.length === 0;

  const scenarioUuid = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(paydownScenarios).values({
    uuid: scenarioUuid,
    userId,
    name: name.trim() || 'Untitled Scenario',
    isActive: isFirstScenario,
    createdAt: now,
    updatedAt: now,
  });

  // If setting as active, deactivate other scenarios
  if (isFirstScenario) {
    // No other scenarios to deactivate
  } else {
    // Don't auto-activate new scenarios
  }

  return await getScenarioById(db, scenarioUuid, userId);
};

export const updateScenario = async (
  db: DrizzleClient,
  scenarioId: string,
  userId: string,
  updates: { name?: string },
) => {
  // Verify ownership
  const scenario = await getScenarioById(db, scenarioId, userId);
  if (!scenario) {
    return null;
  }

  await db
    .update(paydownScenarios)
    .set({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(paydownScenarios.uuid, scenarioId));

  return await getScenarioById(db, scenarioId, userId);
};

export const deleteScenario = async (db: DrizzleClient, scenarioId: string, userId: string) => {
  // Verify ownership
  const scenario = await getScenarioById(db, scenarioId, userId);
  if (!scenario) {
    return false;
  }

  await db.delete(paydownScenarios).where(eq(paydownScenarios.uuid, scenarioId));

  // If deleted scenario was active, set first scenario as active (or null if none)
  const remainingScenarios = await db
    .select()
    .from(paydownScenarios)
    .where(eq(paydownScenarios.userId, userId))
    .orderBy(desc(paydownScenarios.createdAt))
    .limit(1);

  if (remainingScenarios.length > 0 && scenario.isActive) {
    await db
      .update(paydownScenarios)
      .set({ isActive: true })
      .where(eq(paydownScenarios.uuid, remainingScenarios[0].uuid));
  }

  return true;
};

export const setActiveScenarioId = async (
  db: DrizzleClient,
  userId: string,
  scenarioId: string | null,
) => {
  // First, deactivate all scenarios for this user
  await db
    .update(paydownScenarios)
    .set({ isActive: false })
    .where(eq(paydownScenarios.userId, userId));

  // Then activate the specified scenario if provided
  if (scenarioId) {
    // Verify ownership
    const scenario = await getScenarioById(db, scenarioId, userId);
    if (!scenario) {
      return false;
    }

    await db
      .update(paydownScenarios)
      .set({ isActive: true })
      .where(eq(paydownScenarios.uuid, scenarioId));
  }

  return true;
};

// ============================================================================
// DEBT FUNCTIONS
// ============================================================================

// Conversion functions
function convertDebtToDb(debt: {
  name: string;
  type: DebtType;
  amount: number; // dollars
  interestRate: number; // percentage
  monthlyPayment: number; // dollars
  priority?: number;
}) {
  return {
    name: debt.name,
    type: debt.type,
    amount: dollarsToCents(debt.amount),
    interestRate: percentageToBasisPoints(debt.interestRate),
    monthlyPayment: dollarsToCents(debt.monthlyPayment),
    priority: debt.priority ?? 1,
  };
}

function convertDebtFromDb(debt: typeof paydownDebts.$inferSelect) {
  return {
    id: debt.uuid,
    name: debt.name,
    type: debt.type as DebtType,
    amount: centsToDollars(debt.amount),
    interestRate: basisPointsToPercentage(debt.interestRate),
    monthlyPayment: centsToDollars(debt.monthlyPayment),
    priority: debt.priority,
    createdAt: debt.createdAt,
    updatedAt: debt.updatedAt,
  };
}

export const getDebtsByScenarioId = async (
  db: DrizzleClient,
  scenarioId: string,
  userId: string,
) => {
  // Verify scenario ownership
  const scenario = await getScenarioById(db, scenarioId, userId);
  if (!scenario) {
    return [];
  }

  const debts = await db.select().from(paydownDebts).where(eq(paydownDebts.scenarioId, scenarioId));

  return debts.map(convertDebtFromDb);
};

export const getDebtById = async (db: DrizzleClient, debtId: string, userId: string) => {
  const [debt] = await db.select().from(paydownDebts).where(eq(paydownDebts.uuid, debtId)).limit(1);

  if (!debt) {
    return null;
  }

  // Verify scenario ownership
  const scenario = await getScenarioById(db, debt.scenarioId, userId);
  if (!scenario) {
    return null;
  }

  return convertDebtFromDb(debt);
};

export const createDebt = async (
  db: DrizzleClient,
  scenarioId: string,
  userId: string,
  debtData: {
    name: string;
    type: DebtType;
    amount: number;
    interestRate: number;
    monthlyPayment: number;
    priority?: number;
  },
) => {
  // Verify scenario ownership
  const scenario = await getScenarioById(db, scenarioId, userId);
  if (!scenario) {
    throw new Error('Scenario not found or unauthorized');
  }

  const debtUuid = crypto.randomUUID();
  const now = new Date().toISOString();
  const dbData = convertDebtToDb(debtData);

  await db.insert(paydownDebts).values({
    uuid: debtUuid,
    scenarioId,
    ...dbData,
    createdAt: now,
    updatedAt: now,
  });

  return await getDebtById(db, debtUuid, userId);
};

export const updateDebt = async (
  db: DrizzleClient,
  debtId: string,
  userId: string,
  updates: Partial<{
    name: string;
    type: DebtType;
    amount: number;
    interestRate: number;
    monthlyPayment: number;
    priority: number;
  }>,
) => {
  // Get debt and verify ownership
  const debt = await getDebtById(db, debtId, userId);
  if (!debt) {
    return null;
  }

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.amount !== undefined) updateData.amount = dollarsToCents(updates.amount);
  if (updates.interestRate !== undefined)
    updateData.interestRate = percentageToBasisPoints(updates.interestRate);
  if (updates.monthlyPayment !== undefined)
    updateData.monthlyPayment = dollarsToCents(updates.monthlyPayment);
  if (updates.priority !== undefined) updateData.priority = updates.priority;

  await db
    .update(paydownDebts)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(paydownDebts.uuid, debtId));

  return await getDebtById(db, debtId, userId);
};

export const deleteDebt = async (db: DrizzleClient, debtId: string, userId: string) => {
  // Get debt and verify ownership
  const debt = await getDebtById(db, debtId, userId);
  if (!debt) {
    return false;
  }

  await db.delete(paydownDebts).where(eq(paydownDebts.uuid, debtId));
  return true;
};

// ============================================================================
// INCOME FUNCTIONS
// ============================================================================

function convertIncomeToDb(income: { title: string; amount: number }) {
  return {
    title: income.title,
    amount: dollarsToCents(income.amount),
  };
}

function convertIncomeFromDb(income: typeof paydownIncomes.$inferSelect) {
  return {
    id: income.uuid,
    title: income.title,
    amount: centsToDollars(income.amount),
    createdAt: income.createdAt,
    updatedAt: income.updatedAt,
  };
}

export const getIncomesByScenarioId = async (
  db: DrizzleClient,
  scenarioId: string,
  userId: string,
) => {
  // Verify scenario ownership
  const scenario = await getScenarioById(db, scenarioId, userId);
  if (!scenario) {
    return [];
  }

  const incomes = await db
    .select()
    .from(paydownIncomes)
    .where(eq(paydownIncomes.scenarioId, scenarioId));

  return incomes.map(convertIncomeFromDb);
};

export const getIncomeById = async (db: DrizzleClient, incomeId: string, userId: string) => {
  const [income] = await db
    .select()
    .from(paydownIncomes)
    .where(eq(paydownIncomes.uuid, incomeId))
    .limit(1);

  if (!income) {
    return null;
  }

  // Verify scenario ownership
  const scenario = await getScenarioById(db, income.scenarioId, userId);
  if (!scenario) {
    return null;
  }

  return convertIncomeFromDb(income);
};

export const createIncome = async (
  db: DrizzleClient,
  scenarioId: string,
  userId: string,
  incomeData: { title: string; amount: number },
) => {
  // Verify scenario ownership
  const scenario = await getScenarioById(db, scenarioId, userId);
  if (!scenario) {
    throw new Error('Scenario not found or unauthorized');
  }

  const incomeUuid = crypto.randomUUID();
  const now = new Date().toISOString();
  const dbData = convertIncomeToDb(incomeData);

  await db.insert(paydownIncomes).values({
    uuid: incomeUuid,
    scenarioId,
    ...dbData,
    createdAt: now,
    updatedAt: now,
  });

  return await getIncomeById(db, incomeUuid, userId);
};

export const updateIncome = async (
  db: DrizzleClient,
  incomeId: string,
  userId: string,
  updates: Partial<{ title: string; amount: number }>,
) => {
  // Get income and verify ownership
  const income = await getIncomeById(db, incomeId, userId);
  if (!income) {
    return null;
  }

  const updateData: any = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.amount !== undefined) updateData.amount = dollarsToCents(updates.amount);

  await db
    .update(paydownIncomes)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(paydownIncomes.uuid, incomeId));

  return await getIncomeById(db, incomeId, userId);
};

export const deleteIncome = async (db: DrizzleClient, incomeId: string, userId: string) => {
  // Get income and verify ownership
  const income = await getIncomeById(db, incomeId, userId);
  if (!income) {
    return false;
  }

  await db.delete(paydownIncomes).where(eq(paydownIncomes.uuid, incomeId));
  return true;
};

// ============================================================================
// RECURRING EXPENSE FUNCTIONS
// ============================================================================

function convertExpenseToDb(expense: { title: string; amount: number }) {
  return {
    title: expense.title,
    amount: dollarsToCents(expense.amount),
  };
}

function convertExpenseFromDb(expense: typeof paydownRecurringExpenses.$inferSelect) {
  return {
    id: expense.uuid,
    title: expense.title,
    amount: centsToDollars(expense.amount),
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

export const getRecurringExpensesByScenarioId = async (
  db: DrizzleClient,
  scenarioId: string,
  userId: string,
) => {
  // Verify scenario ownership
  const scenario = await getScenarioById(db, scenarioId, userId);
  if (!scenario) {
    return [];
  }

  const expenses = await db
    .select()
    .from(paydownRecurringExpenses)
    .where(eq(paydownRecurringExpenses.scenarioId, scenarioId));

  return expenses.map(convertExpenseFromDb);
};

export const getRecurringExpenseById = async (
  db: DrizzleClient,
  expenseId: string,
  userId: string,
) => {
  const [expense] = await db
    .select()
    .from(paydownRecurringExpenses)
    .where(eq(paydownRecurringExpenses.uuid, expenseId))
    .limit(1);

  if (!expense) {
    return null;
  }

  // Verify scenario ownership
  const scenario = await getScenarioById(db, expense.scenarioId, userId);
  if (!scenario) {
    return null;
  }

  return convertExpenseFromDb(expense);
};

export const createRecurringExpense = async (
  db: DrizzleClient,
  scenarioId: string,
  userId: string,
  expenseData: { title: string; amount: number },
) => {
  // Verify scenario ownership
  const scenario = await getScenarioById(db, scenarioId, userId);
  if (!scenario) {
    throw new Error('Scenario not found or unauthorized');
  }

  const expenseUuid = crypto.randomUUID();
  const now = new Date().toISOString();
  const dbData = convertExpenseToDb(expenseData);

  await db.insert(paydownRecurringExpenses).values({
    uuid: expenseUuid,
    scenarioId,
    ...dbData,
    createdAt: now,
    updatedAt: now,
  });

  return await getRecurringExpenseById(db, expenseUuid, userId);
};

export const updateRecurringExpense = async (
  db: DrizzleClient,
  expenseId: string,
  userId: string,
  updates: Partial<{ title: string; amount: number }>,
) => {
  // Get expense and verify ownership
  const expense = await getRecurringExpenseById(db, expenseId, userId);
  if (!expense) {
    return null;
  }

  const updateData: any = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.amount !== undefined) updateData.amount = dollarsToCents(updates.amount);

  await db
    .update(paydownRecurringExpenses)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(paydownRecurringExpenses.uuid, expenseId));

  return await getRecurringExpenseById(db, expenseId, userId);
};

export const deleteRecurringExpense = async (
  db: DrizzleClient,
  expenseId: string,
  userId: string,
) => {
  // Get expense and verify ownership
  const expense = await getRecurringExpenseById(db, expenseId, userId);
  if (!expense) {
    return false;
  }

  await db.delete(paydownRecurringExpenses).where(eq(paydownRecurringExpenses.uuid, expenseId));
  return true;
};

// ============================================================================
// SAVED PLAN FUNCTIONS
// ============================================================================

export const getSavedPlansByUserId = async (db: DrizzleClient, userId: string) => {
  const plans = await db
    .select()
    .from(paydownSavedPlans)
    .where(eq(paydownSavedPlans.userId, userId))
    .orderBy(desc(paydownSavedPlans.createdAt));

  return plans.map(convertSavedPlanFromDb);
};

export const getSavedPlanById = async (db: DrizzleClient, planId: string, userId: string) => {
  const [plan] = await db
    .select()
    .from(paydownSavedPlans)
    .where(and(eq(paydownSavedPlans.uuid, planId), eq(paydownSavedPlans.userId, userId)))
    .limit(1);

  if (!plan) {
    return null;
  }

  return convertSavedPlanFromDb(plan);
};

export const createSavedPlan = async (
  db: DrizzleClient,
  userId: string,
  planData: {
    name: string;
    scenarioId?: string | null;
    planStartDate: Date;
    yearsToPlan: number;
    additionalSnowball: number;
    paymentPlan: any; // MonthlyPaymentPlan[]
    manuallyEditedPayments: Record<number, Record<string, number>>;
    manuallyEditedIncomes: Record<number, Record<string, number>>;
    manuallyEditedRecurringExpenses: Record<number, Record<string, number>>;
    debts: any[]; // PaydownDebt[]
    incomes: any[]; // MonthlyIncome[]
    recurringExpenses: any[]; // RecurringExpense[]
  },
) => {
  // Check max saved plans limit (5)
  const existingPlans = await db
    .select()
    .from(paydownSavedPlans)
    .where(eq(paydownSavedPlans.userId, userId));

  if (existingPlans.length >= 5) {
    throw new Error('Maximum of 5 saved plans allowed');
  }

  const planUuid = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(paydownSavedPlans).values({
    uuid: planUuid,
    userId,
    name: planData.name.trim() || 'Untitled Plan',
    scenarioId: planData.scenarioId || null,
    planStartDate: planData.planStartDate.toISOString(),
    yearsToPlan: planData.yearsToPlan,
    additionalSnowball: dollarsToCents(planData.additionalSnowball),
    paymentPlan: planData.paymentPlan,
    manuallyEditedPayments: planData.manuallyEditedPayments,
    manuallyEditedIncomes: planData.manuallyEditedIncomes,
    manuallyEditedRecurringExpenses: planData.manuallyEditedRecurringExpenses,
    debts: planData.debts,
    incomes: planData.incomes,
    recurringExpenses: planData.recurringExpenses,
    createdAt: now,
    updatedAt: now,
  });

  return await getSavedPlanById(db, planUuid, userId);
};

export const updateSavedPlan = async (
  db: DrizzleClient,
  planId: string,
  userId: string,
  updates: Partial<{
    name?: string;
    planStartDate?: Date;
    yearsToPlan?: number;
    additionalSnowball?: number;
    paymentPlan?: any;
    manuallyEditedPayments?: Record<number, Record<string, number>>;
    manuallyEditedIncomes?: Record<number, Record<string, number>>;
    manuallyEditedRecurringExpenses?: Record<number, Record<string, number>>;
    debts?: any[];
    incomes?: any[];
    recurringExpenses?: any[];
  }>,
) => {
  // Get plan and verify ownership
  const plan = await getSavedPlanById(db, planId, userId);
  if (!plan) {
    return null;
  }

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.planStartDate !== undefined)
    updateData.planStartDate = updates.planStartDate.toISOString();
  if (updates.yearsToPlan !== undefined) updateData.yearsToPlan = updates.yearsToPlan;
  if (updates.additionalSnowball !== undefined)
    updateData.additionalSnowball = dollarsToCents(updates.additionalSnowball);
  if (updates.paymentPlan !== undefined) updateData.paymentPlan = updates.paymentPlan;
  if (updates.manuallyEditedPayments !== undefined)
    updateData.manuallyEditedPayments = updates.manuallyEditedPayments;
  if (updates.manuallyEditedIncomes !== undefined)
    updateData.manuallyEditedIncomes = updates.manuallyEditedIncomes;
  if (updates.manuallyEditedRecurringExpenses !== undefined)
    updateData.manuallyEditedRecurringExpenses = updates.manuallyEditedRecurringExpenses;
  if (updates.debts !== undefined) updateData.debts = updates.debts;
  if (updates.incomes !== undefined) updateData.incomes = updates.incomes;
  if (updates.recurringExpenses !== undefined)
    updateData.recurringExpenses = updates.recurringExpenses;

  await db
    .update(paydownSavedPlans)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(paydownSavedPlans.uuid, planId));

  return await getSavedPlanById(db, planId, userId);
};

export const deleteSavedPlan = async (db: DrizzleClient, planId: string, userId: string) => {
  // Get plan and verify ownership
  const plan = await getSavedPlanById(db, planId, userId);
  if (!plan) {
    return false;
  }

  await db.delete(paydownSavedPlans).where(eq(paydownSavedPlans.uuid, planId));
  return true;
};

function convertSavedPlanFromDb(plan: typeof paydownSavedPlans.$inferSelect) {
  return {
    id: plan.uuid,
    name: plan.name,
    scenarioId: plan.scenarioId,
    planStartDate: plan.planStartDate,
    yearsToPlan: plan.yearsToPlan,
    additionalSnowball: centsToDollars(plan.additionalSnowball),
    paymentPlan: plan.paymentPlan as any, // MonthlyPaymentPlan[]
    manuallyEditedPayments: plan.manuallyEditedPayments as Record<number, Record<string, number>>,
    manuallyEditedIncomes: plan.manuallyEditedIncomes as Record<number, Record<string, number>>,
    manuallyEditedRecurringExpenses: plan.manuallyEditedRecurringExpenses as Record<
      number,
      Record<string, number>
    >,
    debts: plan.debts as any[], // PaydownDebt[]
    incomes: plan.incomes as any[], // MonthlyIncome[]
    recurringExpenses: plan.recurringExpenses as any[], // RecurringExpense[]
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}
