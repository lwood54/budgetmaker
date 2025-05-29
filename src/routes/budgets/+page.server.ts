import { budgets, categories } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { getBudgets } from '$lib/api/budgets';

export const load: PageServerLoad = async ({ locals }) => {
  return {
    budgets: await getBudgets(locals.db),
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
    const limit = Number(formData.get('limit')) as number;
    const budgetId = formData.get('budgetId') as string;

    if (!budgetId) {
      return fail(400, { error: 'Budget is required' });
    }

    await locals.db.insert(categories).values({
      uuid: crypto.randomUUID(),
      name: name as string,
      limit: limit as number,
      budgetId: budgetId as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
};
