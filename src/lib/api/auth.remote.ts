import { query, getRequestEvent, form } from '$app/server';
import { invalid, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import {
  validateCredentials,
  createSession,
  setAuthCookies,
  clearAuthCookies,
  deleteSession,
} from '$lib/server/auth';
import { createUser } from '$lib/server/auth';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import {
  sendVerificationEmail,
  verifyEmailToken,
  resendVerificationEmail,
} from '$lib/server/emailVerification';
import {
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPassword,
} from '$lib/server/passwordReset';
import { performCleanup } from '$lib/server/userCleanup';
import { Route } from '$lib/constants/routes';

// NOTE: Get current user query - provides user data for client-side components
export const getCurrentUser = query(async () => {
  const event = getRequestEvent();
  const user = event.locals.user || null;
  return user;
});

// Login form
export const login = form(
  z.object({
    email: z.string().email('Please enter a valid email address').min(3),
    password: z.string().min(1, 'Password is required'),
    redirectTo: z.string().optional(),
  }),
  async ({ email, password, redirectTo }, issue) => {
    const event = getRequestEvent();
    const finalRedirectTo = redirectTo || Route.home;

    try {
      // Validate credentials
      const user = await validateCredentials(email, password, event.locals.db);

      if (!user) {
        invalid(issue.password('Invalid email or password'));
      }

      // Check if email is verified
      if (!user.emailVerified) {
        invalid(issue.email('Please verify your email address before logging in'), {
          needsVerification: true,
        } as any);
      }

      // Create session and tokens
      const { accessToken, sessionId, expiresAt } = await createSession(
        user.uuid,
        user.email,
        user.isAdmin || false,
        event.locals.db,
      );

      // Set authentication cookies
      setAuthCookies(event.cookies, accessToken, sessionId, expiresAt);
    } catch (error) {
      // Re-throw validation errors (they're already handled by invalid())
      if (error && typeof error === 'object' && 'status' in error && error.status === 422) {
        throw error;
      }
      // Log and handle unexpected errors
      console.error('[auth.remote.ts] Login error:', error);
      invalid(issue.email('An unexpected error occurred. Please try again.'));
    }

    // NOTE: If we made it here, login was successful - redirect after try/catch
    // This way redirect() won't be caught by the catch block
    throw redirect(302, finalRedirectTo);
  },
);

// Signup form
export const signup = form(
  z
    .object({
      email: z.string().email('Please enter a valid email address'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .refine((pwd) => /[A-Z]/.test(pwd), 'Password must contain at least one uppercase letter')
        .refine((pwd) => /[a-z]/.test(pwd), 'Password must contain at least one lowercase letter')
        .refine((pwd) => /\d/.test(pwd), 'Password must contain at least one number')
        .refine(
          (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
          'Password must contain at least one special character',
        ),
      confirmPassword: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
  async ({ email, password, firstName, lastName }, issue) => {
    const event = getRequestEvent();

    try {
      // Check if user already exists
      const existingUser = await event.locals.db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0) {
        invalid(issue.email('An account with this email already exists'));
      }

      const userId = await createUser(
        email,
        password,
        firstName || undefined,
        lastName || undefined,
        event.locals.db,
      );

      try {
        await sendVerificationEmail(
          email.toLowerCase(),
          userId,
          firstName || undefined,
          event.locals.baseUrl,
          event.locals.db,
        );
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        throw redirect(
          302,
          '/verify-email?email=' + encodeURIComponent(email) + '&error=email_send_failed',
        );
      }
    } catch (error) {
      if (error instanceof Response) {
        throw error; // Re-throw redirects
      }
      console.error('Signup error:', error);

      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        invalid(issue.email('An account with this email already exists'));
      }

      invalid(issue.email('An unexpected error occurred. Please try again.'));
    }

    // Redirect to verify email page
    throw redirect(302, '/verify-email?email=' + encodeURIComponent(email));
  },
);

// Logout form
export const logout = form(z.object({}), async () => {
  const event = getRequestEvent();

  if (event.locals.user?.sessionId) {
    try {
      await deleteSession(event.locals.user.sessionId, event.locals.db);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  clearAuthCookies(event.cookies);
  throw redirect(302, Route.login);
});

// Verify email - query function for load
export const getVerifyEmailData = query(
  z.object({
    token: z.string().optional(),
    email: z.string().optional(),
    error: z.string().optional(),
  }),
  async ({ token, email, error: errorParam }) => {
    const event = getRequestEvent();

    // If user is already logged in, redirect to home
    if (event.locals.user) {
      throw redirect(302, Route.home);
    }

    // If token is provided, attempt verification
    if (token) {
      const result = await verifyEmailToken(token, event.locals.db);

      if (result.success && result.userId) {
        // Get user details for auto-login
        const userResult = await event.locals.db
          .select()
          .from(users)
          .where(eq(users.uuid, result.userId))
          .limit(1);

        if (userResult.length > 0) {
          const user = userResult[0];

          // Automatically create session and set cookies upon successful verification
          try {
            const { accessToken, sessionId, expiresAt } = await createSession(
              user.uuid,
              user.email,
              user.isAdmin || false,
              event.locals.db,
            );

            setAuthCookies(event.cookies, accessToken, sessionId, expiresAt);
          } catch (error) {
            console.error('Auto-login error:', error);
            // Fall back to manual login if auto-login fails
            return {
              verified: true,
              email: user.email,
              firstName: user.firstName,
              userId: user.uuid,
              isAdmin: user.isAdmin || false,
              autoLoginFailed: true,
            };
          }
          throw redirect(302, `${Route.home}?welcome=true&verified=true`);
        }
      }

      return {
        verified: false,
        error: result.error,
        email,
      };
    }

    return {
      verified: false,
      email,
      error:
        errorParam === 'email_send_failed'
          ? 'Failed to send verification email. Please try resending.'
          : null,
    };
  },
);

// Resend verification email
export const resendVerification = form(
  z.object({
    email: z.string().email('Email is required'),
  }),
  async ({ email }, issue) => {
    const event = getRequestEvent();

    if (!email) {
      invalid(issue.email('Email is required'));
    }

    const baseUrl = event.locals.baseUrl;
    const result = await resendVerificationEmail(email, baseUrl, event.locals.db);

    if (!result.success) {
      invalid(issue.email(result.error || 'Failed to send verification email. Please try again.'));
    }

    return {
      success: true,
      message: 'Verification email sent successfully',
      email,
    };
  },
);

// Manual login after verification (fallback)
export const manualLoginAfterVerification = form(
  z.object({
    userId: z.string(),
    email: z.string().email(),
  }),
  async ({ userId, email }, issue) => {
    const event = getRequestEvent();

    try {
      const userResult = await event.locals.db
        .select()
        .from(users)
        .where(eq(users.uuid, userId))
        .limit(1);

      const isAdmin = userResult[0]?.isAdmin || false;

      const { accessToken, sessionId, expiresAt } = await createSession(
        userId,
        email,
        isAdmin,
        event.locals.db,
      );

      setAuthCookies(event.cookies, accessToken, sessionId, expiresAt);
    } catch (error) {
      console.error('Auto-login error:', error);
      invalid(issue.userId('Failed to log in. Please try logging in manually.'));
    }

    throw redirect(302, '/dashboard?welcome=true&verified=true');
  },
);

// Password reset - query function for load
export const getPasswordResetData = query(
  z.object({
    token: z.string().optional(),
    step: z.string().optional(),
  }),
  async ({ token, step }) => {
    const event = getRequestEvent();

    if (event.locals.user) {
      throw redirect(302, Route.dashboard);
    }

    if (token) {
      const result = await verifyPasswordResetToken(token, event.locals.db);

      if (!result.success) {
        return {
          step: 'request',
          error: result.error,
          token: null,
        };
      }

      return {
        step: 'reset',
        token,
        error: null,
      };
    }

    return {
      step: step === 'sent' ? 'sent' : 'request',
      token: null,
      error: null,
    };
  },
);

// Request password reset
export const requestPasswordResetForm = form(
  z.object({
    email: z.string().email('Please enter a valid email address').min(3),
  }),
  async ({ email }, issue) => {
    const event = getRequestEvent();

    try {
      const result = await requestPasswordReset(email, event.url.origin, event.locals.db);

      if (!result.success) {
        invalid(
          issue.email(result.error || 'Failed to send password reset email. Please try again.'),
        );
      }
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      console.error('Password reset request error:', error);
      invalid(issue.email('An unexpected error occurred. Please try again.'));
    }

    throw redirect(302, `${Route.reset}?step=sent`);
  },
);

// Reset password
export const resetPasswordForm = form(
  z
    .object({
      token: z.string().min(1, 'Invalid reset token'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .refine((pwd) => /[A-Z]/.test(pwd), 'Password must contain at least one uppercase letter')
        .refine((pwd) => /[a-z]/.test(pwd), 'Password must contain at least one lowercase letter')
        .refine((pwd) => /\d/.test(pwd), 'Password must contain at least one number')
        .refine(
          (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
          'Password must contain at least one special character',
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
  async ({ token, password }, issue) => {
    const event = getRequestEvent();

    try {
      const result = await resetPassword(token, password, event.locals.db);

      if (!result.success) {
        const errorMessage =
          'error' in result && result.error ? result.error : 'Password reset failed';
        const isTokenError =
          errorMessage.includes('token') ||
          errorMessage.includes('expired') ||
          errorMessage.includes('Invalid');

        if (isTokenError) {
          invalid(issue.token(errorMessage));
        } else {
          invalid(issue.password(errorMessage));
        }
      }
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      console.error('Password reset error:', error);
      invalid(issue.password('An unexpected error occurred. Please try again.'));
    }

    throw redirect(
      302,
      '/login?message=Password reset successfully. Please log in with your new password.',
    );
  },
);

// Admin cleanup
export const performCleanupAction = form(z.object({}), async () => {
  const event = getRequestEvent();

  if (!event.locals.user?.isAdmin) {
    throw new Response('Unauthorized', { status: 403 });
  }

  try {
    const result = await performCleanup(event.locals.db);

    return {
      success: true,
      deletedCount: result.deletedCount,
      deletedTokenCount: result.deletedTokenCount,
      timestamp: result.timestamp,
    };
  } catch (error) {
    console.error('Cleanup error:', error);
    throw new Response(error instanceof Error ? error.message : 'Unknown error occurred', {
      status: 500,
    });
  }
});
