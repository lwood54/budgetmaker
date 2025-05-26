import { randomUUID } from 'node:crypto';
import { passwordResetTokens, users } from './db/schema';
import { eq } from 'drizzle-orm';
import type { DrizzleClient } from './db';
import { sendEmail } from './email';
import bcrypt from 'bcryptjs';

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

    if (!tokenVerification.success) {
      return tokenVerification;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.uuid, tokenVerification.userId!));

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

function generatePasswordResetEmailHtml(resetUrl: string, firstName?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
        <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
        
        ${firstName ? `<p>Hi ${firstName},</p>` : '<p>Hi there,</p>'}
        
        <p>We received a request to reset your password for your BudgetMaker account. If you made this request, click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold; 
                    display: inline-block;
                    font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          ${resetUrl}
        </p>
        
        <p><strong>This reset link will expire in 1 hour.</strong></p>
        
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
          Best regards,<br>
          The BudgetMaker Team
        </p>
      </div>
    </body>
    </html>
  `;
}
