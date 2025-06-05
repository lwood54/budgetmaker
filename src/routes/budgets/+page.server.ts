import { budgetItems, budgets, categories } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { getBudgetsByUserId } from '$lib/api/budgets';
import { dollarsToCents, parseUserInputToCents } from '$lib/utils/money';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user?.userId) {
    return { budgets: [] };
  }

  return {
    budgets: await getBudgetsByUserId(locals.db, locals.user.userId),
  };
};

export const actions: Actions = {
  addBudget: async ({ locals, request }) => {
    const formData = await request.formData();
    const name = formData.get('name');
    const userId = locals.user?.userId;

    if (!userId) {
      return fail(401, { error: 'Unauthorized' });
    }

    await locals.db.insert(budgets).values({
      uuid: crypto.randomUUID(),
      name: name as string,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
  addCategory: async ({ locals, request }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const limitInput = formData.get('limit') as string;
    const budgetId = formData.get('budgetId') as string;

    if (!budgetId) {
      return fail(400, { error: 'Budget is required' });
    }

    const limitCents = parseUserInputToCents(limitInput);
    if (limitCents === null) {
      return fail(400, { error: 'Invalid limit amount' });
    }

    await locals.db.insert(categories).values({
      uuid: crypto.randomUUID(),
      name: name,
      limit: limitCents,
      budgetId: budgetId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
  editCategory: async ({ locals, request, url }) => {
    const formData = await request.formData();
    const categoryId = url.searchParams.get('categoryUUID');
    const name = formData.get('name') as string;
    const limitInput = formData.get('limit') as string;
    const budgetId = formData.get('budgetId') as string;

    if (!categoryId || !name || !limitInput || !budgetId) {
      return fail(400, { error: 'Category is required' });
    }

    const limitCents = parseUserInputToCents(limitInput);
    if (limitCents === null) {
      return fail(400, { error: 'Invalid limit amount' });
    }

    await locals.db
      .update(categories)
      .set({
        name,
        limit: limitCents,
        budgetId,
      })
      .where(eq(categories.uuid, categoryId));
  },
  addBudgetItem: async ({ locals, request }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const amountInput = formData.get('amount') as string;
    const budgetId = formData.get('budgetId') as string;
    const categoryId = formData.get('categoryId') as string;
    const purchaseDate = formData.get('purchaseDate') as string;

    if (!budgetId || !categoryId) {
      return fail(400, { error: 'Budget and category are required' });
    }

    const amountCents = parseUserInputToCents(amountInput);
    if (amountCents === null) {
      return fail(400, { error: 'Invalid amount' });
    }

    await locals.db.insert(budgetItems).values({
      amount: amountCents,
      budgetId,
      categoryId,
      name,
      purchaseDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uuid: crypto.randomUUID(),
    });
  },
  editBudgetItem: async ({ locals, request, url }) => {
    const formData = await request.formData();
    const budgetItemId = url.searchParams.get('budgetItemUUID');
    const name = formData.get('name') as string;
    const amountInput = formData.get('amount') as string;
    const purchaseDate = formData.get('purchaseDate') as string;

    if (!budgetItemId || !name || !amountInput || !purchaseDate) {
      return fail(400, { error: 'BudgetItem is required' });
    }

    const amountCents = parseUserInputToCents(amountInput);
    if (amountCents === null) {
      return fail(400, { error: 'Invalid amount' });
    }

    await locals.db
      .update(budgetItems)
      .set({
        name,
        amount: amountCents,
        purchaseDate,
      })
      .where(eq(budgetItems.uuid, budgetItemId));
  },
};
