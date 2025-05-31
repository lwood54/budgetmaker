import { getBudgetById } from '$lib/api/budgets';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user?.userId) {
    return { budgets: [] };
  }

  return {
    budget: await getBudgetById(locals.db, params.uuid),
  };
};
