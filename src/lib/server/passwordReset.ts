import { randomUUID } from 'node:crypto';
import { passwordResetTokens, users } from './db/schema';
import { eq } from 'drizzle-orm';
import type { DrizzleClient } from './db';
import { sendEmail } from './email';
import bcrypt from 'bcryptjs';
import { generateEmailHtml } from '$lib/components/email-templates';

const RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

export async function createPasswordResetToken(userId: string, db: DrizzleClient) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY);

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

  await db.insert(passwordResetTokens).values({
    uuid: randomUUID(),
    userId,
    token,
    expiresAt: expiresAt.toISOString(),
  });

  return token;
}

export async function sendPasswordResetEmail(
  email: string,
  userId: string,
  firstName: string | undefined,
  baseUrl: string,
  db: DrizzleClient,
) {
  try {
    const token = await createPasswordResetToken(userId, db);
    const resetUrl = `${baseUrl}/reset?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Reset your BudgetMaker password',
      html: generatePasswordResetEmailHtml(resetUrl, firstName),
    });

    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

export async function verifyPasswordResetToken(token: string, db: DrizzleClient) {
  try {
    const tokenResult = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (tokenResult.length === 0) {
      return { success: false, error: 'Invalid reset token' };
    }

    const tokenData = tokenResult[0];

    // NOTE: clean up expired token
    if (new Date(tokenData.expiresAt) < new Date()) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
      return { success: false, error: 'Reset token has expired' };
    }

    return { success: true, userId: tokenData.userId, token };
  } catch (error) {
    console.error('Password reset token verification error:', error);
    return { success: false, error: 'An error occurred during verification' };
  }
}

export async function resetPassword(token: string, newPassword: string, db: DrizzleClient) {
  try {
    const tokenVerification = await verifyPasswordResetToken(token, db);

    if (!tokenVerification.success || !tokenVerification.userId) {
      return tokenVerification;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.uuid, tokenVerification.userId));

    // NOTE: delete the used token
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'An error occurred while resetting password' };
  }
}

export async function requestPasswordReset(email: string, baseUrl: string, db: DrizzleClient) {
  try {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (userResult.length === 0) {
      // NOTE: For security, don't reveal if email exists or not
      return { success: true };
    }

    const user = userResult[0];

    await sendPasswordResetEmail(user.email, user.uuid, user.firstName || undefined, baseUrl, db);

    return { success: true };
  } catch (error) {
    console.error('Request password reset error:', error);
    return { success: false, error: 'Failed to send password reset email' };
  }
}

const generatePasswordResetEmailHtml = (resetUrl: string, firstName?: string) => {
  return generateEmailHtml({
    buttonTitle: 'Reset Password',
    expireInHours: 1,
    firstName,
    requestLinkUrl: resetUrl,
    requestTo: 'reset your password',
    title: 'Reset Your Password',
  });
};
