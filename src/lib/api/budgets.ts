import type { DrizzleClient } from '$lib/server/db';
import { budgets, categories, budgetItems } from '$lib/server/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

export const getBudgetsByUserId = async (db: DrizzleClient, userId: string) => {
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

export const getBudgetById = async (db: DrizzleClient, budgetId: string) => {
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

export const getCategoriesByBudgetId = async (db: DrizzleClient, budgetId: string) => {
  return await db
    .select()
    .from(categories)
    .where(eq(categories.budgetId, budgetId))
    .orderBy(desc(categories.name));
};

export const getBudgetItemsByCategoryId = async (
  db: DrizzleClient,
  categoryId: string,
  budgetId: string,
) => {
  // First verify the category belongs to the budget
  const category = await db
    .select()
    .from(categories)
    .where(eq(categories.uuid, categoryId))
    .limit(1);

  if (category.length === 0 || category[0].budgetId !== budgetId) {
    return null;
  }

  // Get all budget items for this category
  const items = await db
    .select()
    .from(budgetItems)
    .where(eq(budgetItems.categoryId, categoryId))
    .orderBy(desc(budgetItems.purchaseDate));

  return {
    category: category[0],
    items,
  };
};
