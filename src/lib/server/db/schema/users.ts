import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  uuid: text().primaryKey(),
  email: text().notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Note: User type is commented out as it's not used elsewhere
// export type User = InferSelectModel<typeof users>;
