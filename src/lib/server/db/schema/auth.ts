import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const sessions = sqliteTable('sessions', {
  uuid: text().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.uuid, { onDelete: 'cascade' }),
  token: text().notNull(),
  expiresAt: text('expires_at', { mode: 'text' }).notNull(),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  uuid: text().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.uuid, { onDelete: 'cascade' }),
  token: text().notNull().unique(),
  expiresAt: text('expires_at', { mode: 'text' }).notNull(),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  uuid: text().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.uuid, { onDelete: 'cascade' }),
  token: text().notNull().unique(),
  expiresAt: text('expires_at', { mode: 'text' }).notNull(),
  createdAt: text('created_at', { mode: 'text' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Note: These types are commented out as they're not used elsewhere
// export type Session = InferSelectModel<typeof sessions>;
// export type PasswordResetToken = InferSelectModel<typeof passwordResetTokens>;
// export type EmailVerificationToken = InferSelectModel<typeof emailVerificationTokens>;
