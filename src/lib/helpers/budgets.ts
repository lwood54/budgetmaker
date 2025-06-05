import type { BudgetItem } from '$lib/server/db/schema';

export const getCategoryTotalSpent = (categoryId: string, budgetItems: BudgetItem[]) => {
  return budgetItems.reduce((acc, item) => {
    if (item.categoryId === categoryId) {
      return acc + item.amount;
    }
    return acc;
  }, 0);
};
