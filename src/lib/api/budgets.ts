import type { DrizzleClient } from '$lib/server/db';
import { budgets, categories } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export const getBudgets = async (db: DrizzleClient) => {
  return await db.select().from(budgets).orderBy(desc(budgets.createdAt));
};

export const getBudget = async (db: DrizzleClient, budgetId: string) => {
  return await db.select().from(budgets).where(eq(budgets.uuid, budgetId));
};

export const getBudgetCategories = async (db: DrizzleClient, budgetId: string) => {
  return await db
    .select()
    .from(categories)
    .where(eq(categories.budgetId, budgetId))
    .orderBy(desc(categories.name));
};
