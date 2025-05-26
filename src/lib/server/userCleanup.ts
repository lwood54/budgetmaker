import { users, emailVerificationTokens } from './db/schema';
import { eq, and, lt, inArray } from 'drizzle-orm';
import type { DrizzleClient } from './db';
import { sendEmail } from './email';

const UNVERIFIED_USER_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function cleanupUnverifiedUsers(db: DrizzleClient) {
  const cutoffDate = new Date(Date.now() - UNVERIFIED_USER_EXPIRY);

  try {
    // NOTE: find unverified users older than 24 hours
    const unverifiedUsers = await db
      .select()
      .from(users)
      .where(and(eq(users.emailVerified, false), lt(users.createdAt, cutoffDate.toISOString())));

    if (unverifiedUsers.length === 0) {
      return { deletedCount: 0, users: [] };
    }

    // NOTE: delete the unverified users using their UUIDs (this will cascade delete their tokens due to foreign key)
    const userUuids = unverifiedUsers.map((user) => user.uuid);
    await db.delete(users).where(inArray(users.uuid, userUuids));

    return {
      deletedCount: unverifiedUsers.length,
      users: unverifiedUsers.map((u) => ({ email: u.email, createdAt: u.createdAt })),
    };
  } catch (error) {
    throw new Error(
      `Failed to cleanup unverified users: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function cleanupExpiredTokens(db: DrizzleClient) {
  const now = new Date();

  try {
    const expiredTokens = await db
      .select()
      .from(emailVerificationTokens)
      .where(lt(emailVerificationTokens.expiresAt, now.toISOString()));

    if (expiredTokens.length > 0) {
      await db
        .delete(emailVerificationTokens)
        .where(lt(emailVerificationTokens.expiresAt, now.toISOString()));
    }

    return { deletedTokenCount: expiredTokens.length };
  } catch (error) {
    throw new Error(
      `Failed to cleanup expired tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function performCleanup(db: DrizzleClient) {
  const userCleanup = await cleanupUnverifiedUsers(db);
  const tokenCleanup = await cleanupExpiredTokens(db);

  const result = {
    ...userCleanup,
    ...tokenCleanup,
    timestamp: new Date().toISOString(),
  };

  // NOTE: sending myself an email every time cleanup is attempted, should be every day at 2am
  try {
    await sendEmail({
      to: 'lwood3499@gmail.com',
      subject: `BudgetMaker Cleanup Report - ${result.deletedCount} users cleaned`,
      html: `
        <h3>Cleanup Summary</h3>
        <p><strong>Timestamp:</strong> ${result.timestamp}</p>
        <p><strong>Unverified users deleted:</strong> ${result.deletedCount}</p>
        <p><strong>Expired tokens deleted:</strong> ${result.deletedTokenCount}</p>
        ${
          result.deletedCount > 0
            ? `
          <h4>Deleted Users:</h4>
          <ul>
            ${result.users.map((u) => `<li>${u.email} (created: ${u.createdAt})</li>`).join('')}
          </ul>
        `
            : ''
        }
      `,
    });
  } catch (emailError) {
    // Don't fail the cleanup if email fails
    console.error('Failed to send cleanup report email:', emailError);
  }

  return result;
}
