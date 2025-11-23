import { query, getRequestEvent, form } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { z } from 'zod';
import {
  getBudgetsByUserId,
  getBudgetById,
  getCategoriesByBudgetId,
  getBudgetItemsByCategoryId,
} from './budgets';
import { budgets, categories, budgetItems } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { dollarsToCents } from '$lib/utils/money';

export const getBudgets = query(async () => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return [];
  }

  return await getBudgetsByUserId(event.locals.db, event.locals.user.userId);
});

export const getBudget = query(z.string(), async (budgetId) => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return null;
  }

  const budget = await getBudgetById(event.locals.db, budgetId);

  if (!budget) {
    return null;
  }

  // Ensure the user owns this budget
  if (budget.userId !== event.locals.user.userId) {
    return null;
  }

  return budget;
});

export const getCategories = query(z.string(), async (budgetId) => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return [];
  }

  // First verify the user owns the budget
  const budget = await getBudgetById(event.locals.db, budgetId);

  if (!budget || budget.userId !== event.locals.user.userId) {
    return [];
  }

  return await getCategoriesByBudgetId(event.locals.db, budgetId);
});

export const getCategoryPurchases = query(
  z.object({ categoryId: z.string(), budgetId: z.string() }),
  async ({ categoryId, budgetId }) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      return null;
    }

    // First verify the user owns the budget
    const budget = await getBudgetById(event.locals.db, budgetId);

    if (!budget || budget.userId !== event.locals.user.userId) {
      return null;
    }

    return await getBudgetItemsByCategoryId(event.locals.db, categoryId, budgetId);
  },
);

// Form functions
export const addBudget = form(
  z.object({
    name: z.string().min(1, 'Budget name is required'),
  }),
  async ({ name }, issue) => {
    console.log('[addBudget remote] Form submission received, name:', name);
    const event = getRequestEvent();
    console.log('[addBudget remote] Request method:', event.request.method);
    console.log('[addBudget remote] Request URL:', event.url.toString());

    if (!event.locals.user?.userId) {
      console.log('[addBudget remote] Unauthorized - no userId');
      invalid(issue.name('Unauthorized'));
    }

    console.log('[addBudget remote] Inserting budget into database');
    await event.locals.db.insert(budgets).values({
      uuid: crypto.randomUUID(),
      name,
      userId: event.locals.user.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('[addBudget remote] Budget created successfully, returning success');
    getBudgets().refresh();
    return {
      success: true,
    };
  },
);

export const addCategory = form(
  z.object({
    name: z.string().min(1, 'Category name is required'),
    limit: z.coerce.number().positive('Limit must be greater than 0'),
    budgetId: z.string().min(1, 'Budget is required'),
  }),
  async ({ name, limit, budgetId }) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      return {
        status: 'failure' as const,
        error: { message: 'Unauthorized' },
      };
    }

    // Verify the user owns the budget
    const budget = await getBudgetById(event.locals.db, budgetId);

    if (!budget || budget.userId !== event.locals.user.userId) {
      return {
        status: 'failure' as const,
        error: { message: 'Budget not found or unauthorized' },
      };
    }

    const limitCents = dollarsToCents(limit);

    await event.locals.db.insert(categories).values({
      uuid: crypto.randomUUID(),
      name,
      limit: limitCents,
      budgetId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return {
      status: 'success' as const,
    };
  },
);

export const addBudgetItem = form(
  z.object({
    name: z.string().min(1, 'Item name is required'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    budgetId: z.string().min(1, 'Budget is required'),
    categoryId: z.string().min(1, 'Category is required'),
    purchaseDate: z.string().min(1, 'Purchase date is required'),
  }),
  async ({ name, amount, budgetId, categoryId, purchaseDate }) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      return {
        status: 'failure' as const,
        error: { message: 'Unauthorized' },
      };
    }

    // Verify the user owns the budget
    const budget = await getBudgetById(event.locals.db, budgetId);

    if (!budget || budget.userId !== event.locals.user.userId) {
      return {
        status: 'failure' as const,
        error: { message: 'Budget not found or unauthorized' },
      };
    }

    // Verify the category belongs to the budget
    const category = await event.locals.db
      .select()
      .from(categories)
      .where(eq(categories.uuid, categoryId))
      .limit(1);

    if (category.length === 0 || category[0].budgetId !== budgetId) {
      return {
        status: 'failure' as const,
        error: { message: 'Category not found or does not belong to budget' },
      };
    }

    const amountCents = dollarsToCents(amount);

    await event.locals.db.insert(budgetItems).values({
      amount: amountCents,
      budgetId,
      categoryId,
      name,
      purchaseDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uuid: crypto.randomUUID(),
    });

    return {
      status: 'success' as const,
    };
  },
);

export const deleteBudget = form(
  z.object({
    budgetId: z.string().min(1, 'Budget ID is required'),
  }),
  async ({ budgetId }) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      return {
        status: 'failure' as const,
        error: { message: 'Unauthorized' },
      };
    }

    // Verify the user owns the budget
    const budget = await getBudgetById(event.locals.db, budgetId);

    if (!budget || budget.userId !== event.locals.user.userId) {
      return {
        status: 'failure' as const,
        error: { message: 'Budget not found or unauthorized' },
      };
    }

    // Delete the budget (cascade will handle categories and budget items)
    await event.locals.db.delete(budgets).where(eq(budgets.uuid, budgetId));

    return {
      status: 'success' as const,
    };
  },
);
