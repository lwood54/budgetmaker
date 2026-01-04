import { query, getRequestEvent, form } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { z } from 'zod';
import {
  getScenariosByUserId,
  getScenarioById,
  getActiveScenarioId,
  createScenario,
  updateScenario,
  deleteScenario,
  setActiveScenarioId,
  getDebtsByScenarioId,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
  getIncomesByScenarioId,
  createIncome,
  updateIncome,
  deleteIncome,
  getRecurringExpensesByScenarioId,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  getSavedPlansByUserId,
  getSavedPlanById,
  createSavedPlan,
  updateSavedPlan,
  deleteSavedPlan,
} from './paydown';
import { paydownDebts, paydownIncomes, paydownRecurringExpenses } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { DebtType } from '$lib/server/db/schema';

// ============================================================================
// QUERY FUNCTIONS (Read-only)
// ============================================================================

export const getScenarios = query(async () => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return [];
  }

  try {
    return await getScenariosByUserId(event.locals.db, event.locals.user.userId);
  } catch (error) {
    console.error('Error in getScenarios query:', error);
    // Return empty array on error - let components handle gracefully
    return [];
  }
});

export const getScenario = query(z.string(), async (scenarioId) => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return null;
  }

  try {
    return await getScenarioById(event.locals.db, scenarioId, event.locals.user.userId);
  } catch (error) {
    console.error('Error in getScenario query:', error);
    // Return null on error - let components handle gracefully
    return null;
  }
});

export const getActiveScenario = query(async () => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return null;
  }

  try {
    const activeScenarioId = await getActiveScenarioId(event.locals.db, event.locals.user.userId);
    if (!activeScenarioId) {
      return null;
    }

    return await getScenarioById(event.locals.db, activeScenarioId, event.locals.user.userId);
  } catch (error) {
    console.error('Error in getActiveScenario query:', error);
    // Return null on error - let components handle gracefully
    return null;
  }
});

export const getDebts = query(z.string(), async (scenarioId) => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return [];
  }

  try {
    return await getDebtsByScenarioId(event.locals.db, scenarioId, event.locals.user.userId);
  } catch (error) {
    console.error('Error in getDebts query:', error);
    // Return empty array on error - let components handle gracefully
    return [];
  }
});

export const getIncomes = query(z.string(), async (scenarioId) => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return [];
  }

  try {
    return await getIncomesByScenarioId(event.locals.db, scenarioId, event.locals.user.userId);
  } catch (error) {
    console.error('Error in getIncomes query:', error);
    // Return empty array on error - let components handle gracefully
    return [];
  }
});

export const getRecurringExpenses = query(z.string(), async (scenarioId) => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return [];
  }

  try {
    return await getRecurringExpensesByScenarioId(
      event.locals.db,
      scenarioId,
      event.locals.user.userId,
    );
  } catch (error) {
    console.error('Error in getRecurringExpenses query:', error);
    // Return empty array on error - let components handle gracefully
    return [];
  }
});

export const getSavedPlans = query(async () => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return [];
  }

  try {
    return await getSavedPlansByUserId(event.locals.db, event.locals.user.userId);
  } catch (error) {
    console.error('Error in getSavedPlans query:', error);
    // Return empty array on error - let components handle gracefully
    return [];
  }
});

export const getSavedPlan = query(z.string(), async (planId) => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return null;
  }

  try {
    return await getSavedPlanById(event.locals.db, planId, event.locals.user.userId);
  } catch (error) {
    console.error('Error in getSavedPlan query:', error);
    // Return null on error - let components handle gracefully
    return null;
  }
});

// ============================================================================
// FORM FUNCTIONS (Mutations)
// ============================================================================

export const createPaydownScenario = form(
  z.object({
    name: z.string().min(1, 'Scenario name is required'),
  }),
  async ({ name }, issue) => {
    const event = getRequestEvent();
    if (!event.locals.user?.userId) {
      invalid(issue.name('Unauthorized'));
    }

    try {
      const scenario = await createScenario(event.locals.db, event.locals.user.userId, name);
      if (!scenario) {
        invalid(issue.name('Failed to create scenario'));
        return;
      }
      getScenarios().refresh();
      getActiveScenario().refresh();
      return {
        success: true,
        id: scenario.uuid,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create scenario';
      invalid(issue.name(errorMessage));
    }
  },
);

export const updatePaydownScenario = form(
  z.object({
    scenarioId: z.string().min(1, 'Scenario ID is required'),
    name: z.string().min(1, 'Scenario name is required'),
  }),
  async ({ scenarioId, name }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.scenarioId('Unauthorized'));
    }

    const updated = await updateScenario(event.locals.db, scenarioId, event.locals.user.userId, {
      name,
    });

    if (!updated) {
      invalid(issue.scenarioId('Scenario not found or unauthorized'));
    }

    getScenarios().refresh();
    getScenario(scenarioId).refresh();
    getActiveScenario().refresh();

    return {
      success: true,
    };
  },
);

export const deletePaydownScenario = form(
  z.object({
    scenarioId: z.string().min(1, 'Scenario ID is required'),
  }),
  async ({ scenarioId }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.scenarioId('Unauthorized'));
    }

    const deleted = await deleteScenario(event.locals.db, scenarioId, event.locals.user.userId);

    if (!deleted) {
      invalid(issue.scenarioId('Scenario not found or unauthorized'));
    }

    getScenarios().refresh();
    getActiveScenario().refresh();

    return {
      success: true,
    };
  },
);

export const setActivePaydownScenario = form(
  z.object({
    scenarioId: z.string().optional(),
  }),
  async ({ scenarioId }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.scenarioId('Unauthorized'));
    }

    const scenarioIdOrNull = scenarioId || null;

    if (scenarioIdOrNull) {
      // Verify ownership
      const scenario = await getScenarioById(
        event.locals.db,
        scenarioIdOrNull,
        event.locals.user.userId,
      );
      if (!scenario) {
        invalid(issue.scenarioId('Scenario not found or unauthorized'));
      }
    }

    await setActiveScenarioId(event.locals.db, event.locals.user.userId, scenarioIdOrNull);

    getScenarios().refresh();
    getActiveScenario().refresh();

    return {
      success: true,
    };
  },
);

export const createPaydownDebt = form(
  z.object({
    scenarioId: z.string().min(1, 'Scenario ID is required'),
    name: z.string().min(1, 'Debt name is required'),
    type: z.enum(['credit-card', 'car', 'mortgage', 'student-loan', 'personal-loan', 'other']),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    interestRate: z.coerce.number().min(0).max(100, 'Interest rate must be between 0 and 100'),
    monthlyPayment: z.coerce.number().positive('Monthly payment must be greater than 0'),
    priority: z.coerce.number().int().min(0).optional(),
  }),
  async ({ scenarioId, name, type, amount, interestRate, monthlyPayment, priority }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.name('Unauthorized'));
    }

    try {
      await createDebt(event.locals.db, scenarioId, event.locals.user.userId, {
        name,
        type: type as DebtType,
        amount,
        interestRate,
        monthlyPayment,
        priority,
      });

      // Only refresh the specific scenario and debts - don't refresh scenarios list or active scenario
      // (they don't change when adding a debt)
      getScenario(scenarioId).refresh();
      getDebts(scenarioId).refresh();

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create debt';
      invalid(issue.name(errorMessage));
    }
  },
);

export const updatePaydownDebt = form(
  z.object({
    debtId: z.string().min(1, 'Debt ID is required'),
    name: z.string().min(1, 'Debt name is required').optional(),
    type: z
      .enum(['credit-card', 'car', 'mortgage', 'student-loan', 'personal-loan', 'other'])
      .optional(),
    amount: z.coerce.number().positive('Amount must be greater than 0').optional(),
    interestRate: z.coerce
      .number()
      .min(0)
      .max(100, 'Interest rate must be between 0 and 100')
      .optional(),
    monthlyPayment: z.coerce.number().positive('Monthly payment must be greater than 0').optional(),
    priority: z.coerce.number().int().min(0).optional(),
  }),
  async ({ debtId, name, type, amount, interestRate, monthlyPayment, priority }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.debtId('Unauthorized'));
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type as DebtType;
    if (amount !== undefined) updates.amount = amount;
    if (interestRate !== undefined) updates.interestRate = interestRate;
    if (monthlyPayment !== undefined) updates.monthlyPayment = monthlyPayment;
    if (priority !== undefined) updates.priority = priority;

    const updated = await updateDebt(event.locals.db, debtId, event.locals.user.userId, updates);

    if (!updated) {
      invalid(issue.debtId('Debt not found or unauthorized'));
    }

    // Get scenario ID from the updated debt to refresh related queries
    const [debtRow] = await event.locals.db
      .select()
      .from(paydownDebts)
      .where(eq(paydownDebts.uuid, debtId))
      .limit(1);

    if (debtRow) {
      // Only refresh the specific scenario and debts - don't refresh scenarios list or active scenario
      getScenario(debtRow.scenarioId).refresh();
      getDebts(debtRow.scenarioId).refresh();
    }

    return {
      success: true,
    };
  },
);

export const deletePaydownDebt = form(
  z.object({
    debtId: z.string().min(1, 'Debt ID is required'),
  }),
  async ({ debtId }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.debtId('Unauthorized'));
    }

    // Get debt to find scenario ID before deleting
    const debt = await getDebtById(event.locals.db, debtId, event.locals.user.userId);
    if (!debt) {
      invalid(issue.debtId('Debt not found or unauthorized'));
    }

    // Get scenario ID from database
    const [debtRow] = await event.locals.db
      .select()
      .from(paydownDebts)
      .where(eq(paydownDebts.uuid, debtId))
      .limit(1);

    const deleted = await deleteDebt(event.locals.db, debtId, event.locals.user.userId);

    if (!deleted) {
      invalid(issue.debtId('Debt not found or unauthorized'));
    }

    if (debtRow) {
      // Only refresh the specific scenario and debts - don't refresh scenarios list or active scenario
      getScenario(debtRow.scenarioId).refresh();
      getDebts(debtRow.scenarioId).refresh();
    }

    return {
      success: true,
    };
  },
);

export const createPaydownIncome = form(
  z.object({
    scenarioId: z.string().min(1, 'Scenario ID is required'),
    title: z.string().min(1, 'Income title is required'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
  }),
  async ({ scenarioId, title, amount }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.title('Unauthorized'));
    }

    try {
      await createIncome(event.locals.db, scenarioId, event.locals.user.userId, {
        title,
        amount,
      });

      // Only refresh the specific scenario and incomes - don't refresh scenarios list or active scenario
      // (they don't change when adding an income)
      getScenario(scenarioId).refresh();
      getIncomes(scenarioId).refresh();

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create income';
      invalid(issue.title(errorMessage));
    }
  },
);

export const updatePaydownIncome = form(
  z.object({
    incomeId: z.string().min(1, 'Income ID is required'),
    title: z.string().min(1, 'Income title is required').optional(),
    amount: z.coerce.number().positive('Amount must be greater than 0').optional(),
  }),
  async ({ incomeId, title, amount }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.incomeId('Unauthorized'));
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (amount !== undefined) updates.amount = amount;

    const updated = await updateIncome(
      event.locals.db,
      incomeId,
      event.locals.user.userId,
      updates,
    );

    if (!updated) {
      invalid(issue.incomeId('Income not found or unauthorized'));
    }

    // Get scenario ID
    const [incomeRow] = await event.locals.db
      .select()
      .from(paydownIncomes)
      .where(eq(paydownIncomes.uuid, incomeId))
      .limit(1);

    if (incomeRow) {
      // Only refresh the specific scenario and incomes - don't refresh scenarios list or active scenario
      getScenario(incomeRow.scenarioId).refresh();
      getIncomes(incomeRow.scenarioId).refresh();
    }

    return {
      success: true,
    };
  },
);

export const deletePaydownIncome = form(
  z.object({
    incomeId: z.string().min(1, 'Income ID is required'),
  }),
  async ({ incomeId }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.incomeId('Unauthorized'));
    }

    // Get scenario ID before deleting
    const [incomeRow] = await event.locals.db
      .select()
      .from(paydownIncomes)
      .where(eq(paydownIncomes.uuid, incomeId))
      .limit(1);

    const deleted = await deleteIncome(event.locals.db, incomeId, event.locals.user.userId);

    if (!deleted) {
      invalid(issue.incomeId('Income not found or unauthorized'));
    }

    if (incomeRow) {
      // Only refresh the specific scenario and incomes - don't refresh scenarios list or active scenario
      getScenario(incomeRow.scenarioId).refresh();
      getIncomes(incomeRow.scenarioId).refresh();
    }

    return {
      success: true,
    };
  },
);

export const createPaydownRecurringExpense = form(
  z.object({
    scenarioId: z.string().min(1, 'Scenario ID is required'),
    title: z.string().min(1, 'Expense title is required'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
  }),
  async ({ scenarioId, title, amount }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.title('Unauthorized'));
    }

    try {
      await createRecurringExpense(event.locals.db, scenarioId, event.locals.user.userId, {
        title,
        amount,
      });

      // Only refresh the specific scenario and expenses - don't refresh scenarios list or active scenario
      // (they don't change when adding an expense)
      getScenario(scenarioId).refresh();
      getRecurringExpenses(scenarioId).refresh();

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create expense';
      invalid(issue.title(errorMessage));
    }
  },
);

export const updatePaydownRecurringExpense = form(
  z.object({
    expenseId: z.string().min(1, 'Expense ID is required'),
    title: z.string().min(1, 'Expense title is required').optional(),
    amount: z.coerce.number().positive('Amount must be greater than 0').optional(),
  }),
  async ({ expenseId, title, amount }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.expenseId('Unauthorized'));
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (amount !== undefined) updates.amount = amount;

    const updated = await updateRecurringExpense(
      event.locals.db,
      expenseId,
      event.locals.user.userId,
      updates,
    );

    if (!updated) {
      invalid(issue.expenseId('Expense not found or unauthorized'));
    }

    // Get scenario ID
    const [expenseRow] = await event.locals.db
      .select()
      .from(paydownRecurringExpenses)
      .where(eq(paydownRecurringExpenses.uuid, expenseId))
      .limit(1);

    if (expenseRow) {
      // Only refresh the specific scenario and expenses - don't refresh scenarios list or active scenario
      getScenario(expenseRow.scenarioId).refresh();
      getRecurringExpenses(expenseRow.scenarioId).refresh();
    }

    return {
      success: true,
    };
  },
);

export const deletePaydownRecurringExpense = form(
  z.object({
    expenseId: z.string().min(1, 'Expense ID is required'),
  }),
  async ({ expenseId }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.expenseId('Unauthorized'));
    }

    // Get scenario ID before deleting
    const [expenseRow] = await event.locals.db
      .select()
      .from(paydownRecurringExpenses)
      .where(eq(paydownRecurringExpenses.uuid, expenseId))
      .limit(1);

    const deleted = await deleteRecurringExpense(
      event.locals.db,
      expenseId,
      event.locals.user.userId,
    );

    if (!deleted) {
      invalid(issue.expenseId('Expense not found or unauthorized'));
    }

    if (expenseRow) {
      // Only refresh the specific scenario and expenses - don't refresh scenarios list or active scenario
      getScenario(expenseRow.scenarioId).refresh();
      getRecurringExpenses(expenseRow.scenarioId).refresh();
    }

    return {
      success: true,
    };
  },
);

export const createPaydownSavedPlan = form(
  z.object({
    name: z.string().min(1, 'Plan name is required'),
    scenarioId: z.string().optional(),
    planStartDate: z.string().min(1, 'Plan start date is required'),
    yearsToPlan: z.coerce.number().int().positive('Years to plan must be positive'),
    additionalSnowball: z.coerce.number().min(0, 'Additional snowball must be >= 0'),
    paymentPlan: z.string().min(1), // JSON string
    manuallyEditedPayments: z.string().optional(), // JSON string
    manuallyEditedIncomes: z.string().optional(), // JSON string
    manuallyEditedRecurringExpenses: z.string().optional(), // JSON string
    debts: z.string().min(1), // JSON string
    incomes: z.string().min(1), // JSON string
    recurringExpenses: z.string().min(1), // JSON string
  }),
  async (
    {
      name,
      scenarioId,
      planStartDate,
      yearsToPlan,
      additionalSnowball,
      paymentPlan,
      manuallyEditedPayments,
      manuallyEditedIncomes,
      manuallyEditedRecurringExpenses,
      debts,
      incomes,
      recurringExpenses,
    },
    issue,
  ) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.name('Unauthorized'));
    }

    try {
      await createSavedPlan(event.locals.db, event.locals.user.userId, {
        name,
        scenarioId: scenarioId && scenarioId.trim() ? scenarioId : null,
        planStartDate: new Date(planStartDate),
        yearsToPlan,
        additionalSnowball,
        paymentPlan: JSON.parse(paymentPlan),
        manuallyEditedPayments: manuallyEditedPayments ? JSON.parse(manuallyEditedPayments) : {},
        manuallyEditedIncomes: manuallyEditedIncomes ? JSON.parse(manuallyEditedIncomes) : {},
        manuallyEditedRecurringExpenses: manuallyEditedRecurringExpenses
          ? JSON.parse(manuallyEditedRecurringExpenses)
          : {},
        debts: JSON.parse(debts),
        incomes: JSON.parse(incomes),
        recurringExpenses: JSON.parse(recurringExpenses),
      });

      getSavedPlans().refresh();

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create saved plan';
      invalid(issue.name(errorMessage));
    }
  },
);

export const updatePaydownSavedPlan = form(
  z.object({
    planId: z.string().min(1, 'Plan ID is required'),
    name: z.string().min(1, 'Plan name is required').optional(),
    planStartDate: z.string().optional(),
    yearsToPlan: z.coerce.number().int().positive().optional(),
    additionalSnowball: z.coerce.number().min(0).optional(),
    paymentPlan: z.string().optional(), // JSON string
    manuallyEditedPayments: z.string().optional(), // JSON string
    manuallyEditedIncomes: z.string().optional(), // JSON string
    manuallyEditedRecurringExpenses: z.string().optional(), // JSON string
    debts: z.string().optional(), // JSON string
    incomes: z.string().optional(), // JSON string
    recurringExpenses: z.string().optional(), // JSON string
  }),
  async (
    {
      planId,
      name,
      planStartDate,
      yearsToPlan,
      additionalSnowball,
      paymentPlan,
      manuallyEditedPayments,
      manuallyEditedIncomes,
      manuallyEditedRecurringExpenses,
      debts,
      incomes,
      recurringExpenses,
    },
    issue,
  ) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.planId('Unauthorized'));
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (planStartDate !== undefined) updates.planStartDate = new Date(planStartDate);
    if (yearsToPlan !== undefined) updates.yearsToPlan = yearsToPlan;
    if (additionalSnowball !== undefined) updates.additionalSnowball = additionalSnowball;
    if (paymentPlan !== undefined) updates.paymentPlan = JSON.parse(paymentPlan);
    if (manuallyEditedPayments !== undefined)
      updates.manuallyEditedPayments = JSON.parse(manuallyEditedPayments);
    if (manuallyEditedIncomes !== undefined)
      updates.manuallyEditedIncomes = JSON.parse(manuallyEditedIncomes);
    if (manuallyEditedRecurringExpenses !== undefined)
      updates.manuallyEditedRecurringExpenses = JSON.parse(manuallyEditedRecurringExpenses);
    if (debts !== undefined) updates.debts = JSON.parse(debts);
    if (incomes !== undefined) updates.incomes = JSON.parse(incomes);
    if (recurringExpenses !== undefined) updates.recurringExpenses = JSON.parse(recurringExpenses);

    const updated = await updateSavedPlan(
      event.locals.db,
      planId,
      event.locals.user.userId,
      updates,
    );

    if (!updated) {
      invalid(issue.planId('Saved plan not found or unauthorized'));
    }

    getSavedPlans().refresh();
    getSavedPlan(planId).refresh();

    return {
      success: true,
    };
  },
);

export const deletePaydownSavedPlan = form(
  z.object({
    planId: z.string().min(1, 'Plan ID is required'),
  }),
  async ({ planId }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.planId('Unauthorized'));
    }

    const deleted = await deleteSavedPlan(event.locals.db, planId, event.locals.user.userId);

    if (!deleted) {
      invalid(issue.planId('Saved plan not found or unauthorized'));
    }

    getSavedPlans().refresh();

    return {
      success: true,
    };
  },
);
