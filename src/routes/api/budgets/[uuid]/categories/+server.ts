import type { RequestHandler } from '@sveltejs/kit';

import { getBudget, getBudgetCategories } from '$lib/api/budgets';

export const GET: RequestHandler = async ({ locals, params, request }) => {
  const authHeader = request.headers.get('Authorization');
  const { uuid: budgetId } = params;

  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!budgetId) {
    return new Response('Budget ID is required', { status: 400 });
  }

  const matchingBudget = await getBudget(locals.db, budgetId);
  if (!matchingBudget) {
    return new Response('Budget not found', { status: 404 });
  }
  if (authHeader !== `Bearer ${matchingBudget[0].userId}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const categories = await getBudgetCategories(locals.db, budgetId);
  return new Response(JSON.stringify(categories), { status: 200 });
};
