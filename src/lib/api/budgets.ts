import type { DrizzleClient } from '$lib/server/db';
import { budgets } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export const getBudgets = async (db: DrizzleClient) => {
  return await db.select().from(budgets).limit(10).orderBy(desc(budgets.createdAt));
};
