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
    const budgetUuid = crypto.randomUUID();
    await event.locals.db.insert(budgets).values({
      uuid: budgetUuid,
      name,
      userId: event.locals.user.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('[addBudget remote] Budget created successfully, returning success');
    getBudgets().refresh();
    return {
      success: true,
      budgetId: budgetUuid,
    };
  },
);

export const addCategory = form(
  z.object({
    name: z.string().min(1, 'Category name is required'),
    limit: z.coerce.number().positive('Limit must be greater than 0'),
    budgetId: z.string().min(1, 'Budget is required'),
  }),
  async ({ name, limit, budgetId }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.name('Unauthorized'));
    }

    // Verify the user owns the budget
    const budget = await getBudgetById(event.locals.db, budgetId);

    if (!budget || budget.userId !== event.locals.user.userId) {
      invalid(issue.budgetId('Budget not found or unauthorized'));
    }

    const limitCents = dollarsToCents(limit);

    const categoryUuid = crypto.randomUUID();
    await event.locals.db.insert(categories).values({
      uuid: categoryUuid,
      name,
      limit: limitCents,
      budgetId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Refresh all related queries
    getBudgets().refresh();
    getBudget(budgetId).refresh();
    getCategories(budgetId).refresh();
    return {
      success: true,
      categoryId: categoryUuid,
      budgetId: budgetId,
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
  async ({ name, amount, budgetId, categoryId, purchaseDate }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.name('Unauthorized'));
    }

    // Verify the user owns the budget
    const budget = await getBudgetById(event.locals.db, budgetId);

    if (!budget || budget.userId !== event.locals.user.userId) {
      invalid(issue.budgetId('Budget not found or unauthorized'));
    }

    // Verify the category belongs to the budget
    const category = await event.locals.db
      .select()
      .from(categories)
      .where(eq(categories.uuid, categoryId))
      .limit(1);

    if (category.length === 0 || category[0].budgetId !== budgetId) {
      invalid(issue.categoryId('Category not found or does not belong to budget'));
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

    // Refresh all related queries
    getBudgets().refresh();
    getBudget(budgetId).refresh();
    getCategories(budgetId).refresh();
    return {
      success: true,
    };
  },
);

export const deleteBudget = form(
  z.object({
    budgetId: z.string().min(1, 'Budget ID is required'),
  }),
  async ({ budgetId }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.budgetId('Unauthorized'));
    }

    // Verify the user owns the budget
    const budget = await getBudgetById(event.locals.db, budgetId);

    if (!budget || budget.userId !== event.locals.user.userId) {
      invalid(issue.budgetId('Budget not found or unauthorized'));
    }

    // Delete the budget (cascade will handle categories and budget items)
    await event.locals.db.delete(budgets).where(eq(budgets.uuid, budgetId));

    getBudgets().refresh();
    return {
      success: true,
    };
  },
);

export const deleteBudgetItem = form(
  z.object({
    budgetItemId: z.string().min(1, 'Budget item ID is required'),
  }),
  async ({ budgetItemId }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.budgetItemId('Unauthorized'));
    }

    // Get the budget item and verify the user owns the budget
    const budgetItem = await event.locals.db
      .select()
      .from(budgetItems)
      .where(eq(budgetItems.uuid, budgetItemId))
      .limit(1);

    if (budgetItem.length === 0) {
      invalid(issue.budgetItemId('Budget item not found'));
    }

    const budget = await getBudgetById(event.locals.db, budgetItem[0].budgetId);

    if (!budget || budget.userId !== event.locals.user.userId) {
      invalid(issue.budgetItemId('Budget not found or unauthorized'));
    }

    // Delete the budget item
    await event.locals.db.delete(budgetItems).where(eq(budgetItems.uuid, budgetItemId));

    // Refresh queries
    getBudgets().refresh();

    return {
      success: true,
    };
  },
);

export const deleteCategory = form(
  z.object({
    categoryId: z.string().min(1, 'Category ID is required'),
  }),
  async ({ categoryId }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.categoryId('Unauthorized'));
    }

    // Get the category and verify the user owns the budget
    const category = await event.locals.db
      .select()
      .from(categories)
      .where(eq(categories.uuid, categoryId))
      .limit(1);

    if (category.length === 0) {
      invalid(issue.categoryId('Category not found'));
    }

    const budget = await getBudgetById(event.locals.db, category[0].budgetId);

    if (!budget || budget.userId !== event.locals.user.userId) {
      invalid(issue.categoryId('Budget not found or unauthorized'));
    }

    // Delete the category (cascade will handle budget items)
    await event.locals.db.delete(categories).where(eq(categories.uuid, categoryId));

    // Refresh all related queries
    const budgetId = category[0].budgetId;
    getBudgets().refresh();
    getBudget(budgetId).refresh();
    getCategories(budgetId).refresh();

    return {
      success: true,
    };
  },
);
