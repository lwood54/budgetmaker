import { randomUUID } from 'node:crypto';
import { emailVerificationTokens, users } from './db/schema';
import { eq } from 'drizzle-orm';
import type { DrizzleClient } from './db';
import { sendEmail, generateVerificationEmailHtml } from './email';

const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export async function createEmailVerificationToken(userId: string, db: DrizzleClient) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));

  await db.insert(emailVerificationTokens).values({
    uuid: randomUUID(),
    userId,
    token,
    expiresAt: expiresAt.toISOString(),
  });

  return token;
}

export async function sendVerificationEmail(
  email: string,
  userId: string,
  firstName: string | null | undefined,
  baseUrl: string,
  db: DrizzleClient,
) {
  try {
    const token = await createEmailVerificationToken(userId, db);
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Verify your BudgetMaker account',
      html: generateVerificationEmailHtml(verificationUrl, firstName),
    });

    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function verifyEmailToken(token: string, db: DrizzleClient) {
  try {
    const tokenResult = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token))
      .limit(1);

    if (tokenResult.length === 0) {
      return { success: false, error: 'Invalid verification token' };
    }

    const tokenData = tokenResult[0];

    if (new Date(tokenData.expiresAt) < new Date()) {
      await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
      return { success: false, error: 'Verification token has expired' };
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.uuid, tokenData.userId));

    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));

    return { success: true, userId: tokenData.userId };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, error: 'An error occurred during verification' };
  }
}

export async function resendVerificationEmail(email: string, baseUrl: string, db: DrizzleClient) {
  try {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (userResult.length === 0) {
      return { success: false, error: 'No account found with this email address' };
    }

    const user = userResult[0];

    if (user.emailVerified) {
      return { success: false, error: 'Email is already verified' };
    }

    await sendVerificationEmail(user.email, user.uuid, user.firstName, baseUrl, db);

    return { success: true };
  } catch (error) {
    console.error('Resend verification email error:', error);
    return { success: false, error: 'Failed to resend verification email' };
  }
}
