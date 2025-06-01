import { getBudgetsByUserId } from '$lib/api/budgets';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user?.userId) {
    return { budgets: [] };
  }
  const budgets = await getBudgetsByUserId(locals.db, locals.user.userId);

  return {
    budget: budgets.find((b) => b.uuid === params.uuid),
    budgets,
  };
};
