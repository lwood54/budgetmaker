import { budgets } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { getBudgets } from '$lib/api/budgets';

export const load: PageServerLoad = async ({ locals }) => {
  return {
    budgets: await getBudgets(locals.db),
  };
};

export const actions: Actions = {
  default: async ({ locals, request }) => {
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
};
