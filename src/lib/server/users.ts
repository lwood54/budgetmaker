import type { DrizzleClient } from './db';
import { users } from './db/schema';

export const getAllUsers = async (db: DrizzleClient, isAdmin: boolean) => {
  const usersData = await db.select().from(users);
  if (isAdmin) {
    return usersData;
  }
  return [];
};
