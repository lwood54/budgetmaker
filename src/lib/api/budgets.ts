import type { DrizzleClient } from '$lib/server/db';
import { budgets, categories, budgetItems } from '$lib/server/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

export const getBudgets = async (db: DrizzleClient) => {
  const allBudgets = await db.select().from(budgets).orderBy(desc(budgets.createdAt));

  if (allBudgets.length === 0) {
    return [];
  }

  const budgetIds = allBudgets.map((b) => b.uuid);

  const [allCategories, allBudgetItems] = await Promise.all([
    db.select().from(categories).where(inArray(categories.budgetId, budgetIds)),
    db.select().from(budgetItems).where(inArray(budgetItems.budgetId, budgetIds)),
  ]);

  return allBudgets.map((budget) => ({
    ...budget,
    categories: allCategories.filter((c) => c.budgetId === budget.uuid),
    budgetItems: allBudgetItems.filter((bi) => bi.budgetId === budget.uuid),
  }));
};

export const getBudgetsForUser = async (db: DrizzleClient, userId: string) => {
  const userBudgets = await db
    .select()
    .from(budgets)
    .where(eq(budgets.userId, userId))
    .orderBy(desc(budgets.createdAt));

  if (userBudgets.length === 0) {
    return [];
  }

  const budgetIds = userBudgets.map((b) => b.uuid);

  const [budgetCategories, userBudgetItems] = await Promise.all([
    db.select().from(categories).where(inArray(categories.budgetId, budgetIds)),
    db.select().from(budgetItems).where(inArray(budgetItems.budgetId, budgetIds)),
  ]);

  return userBudgets.map((budget) => ({
    ...budget,
    categories: budgetCategories.filter((c) => c.budgetId === budget.uuid),
    budgetItems: userBudgetItems.filter((bi) => bi.budgetId === budget.uuid),
  }));
};

export const getBudget = async (db: DrizzleClient, budgetId: string) => {
  const [budget, budgetCategories, budgetItemsData] = await Promise.all([
    db.select().from(budgets).where(eq(budgets.uuid, budgetId)),
    db.select().from(categories).where(eq(categories.budgetId, budgetId)),
    db.select().from(budgetItems).where(eq(budgetItems.budgetId, budgetId)),
  ]);

  if (budget.length === 0) {
    return null;
  }

  return {
    ...budget[0],
    categories: budgetCategories,
    budgetItems: budgetItemsData,
  };
};

export const getBudgetCategories = async (db: DrizzleClient, budgetId: string) => {
  return await db
    .select()
    .from(categories)
    .where(eq(categories.budgetId, budgetId))
    .orderBy(desc(categories.name));
};
