import { query, getRequestEvent, form } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { z } from 'zod';
import {
  validateCredentials,
  createSession,
  setAuthCookies,
  deleteSession,
  clearAuthCookies,
  createUser,
} from '$lib/server/auth';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendVerificationEmail } from '$lib/server/emailVerification';
import {
  requestPasswordReset as requestPasswordResetService,
  verifyPasswordResetToken,
  resetPassword as resetPasswordService,
} from '$lib/server/passwordReset';
import {
  verifyEmailToken,
  resendVerificationEmail as resendVerificationEmailService,
} from '$lib/server/emailVerification';
import { Route } from '$lib/constants/routes';

// Query functions
export const getCurrentUser = query(async () => {
  const event = getRequestEvent();
  return event.locals.user || null;
});

export const getLoginPageData = query(async () => {
  const event = getRequestEvent();

  // If user is already logged in, return redirect info
  if (event.locals.user) {
    return {
      redirectTo: Route.home,
    };
  }

  const message = event.url.searchParams.get('message');
  return {
    message,
  };
});

export const getSignupPageData = query(async () => {
  const event = getRequestEvent();

  // If user is already logged in, return redirect info
  if (event.locals.user) {
    return {
      redirectTo: Route.dashboard,
    };
  }

  return {};
});

export const getVerifyEmailPageData = query(async () => {
  const event = getRequestEvent();
  const url = event.url;

  const token = url.searchParams.get('token');
  const email = url.searchParams.get('email');
  const error = url.searchParams.get('error');

  // If user is already logged in, return redirect info
  if (event.locals.user) {
    return {
      redirectTo: Route.home,
      verified: false,
      email: null,
      error: null,
    };
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
          // Return redirect info for successful auto-login
          return {
            verified: true,
            redirectTo: `${Route.home}?welcome=true&verified=true`,
            email: user.email,
            firstName: user.firstName,
            userId: user.uuid,
            isAdmin: user.isAdmin || false,
            autoLoginFailed: false,
          };
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
      error === 'email_send_failed'
        ? 'Failed to send verification email. Please try resending.'
        : null,
  };
});

export const getResetPageData = query(async () => {
  const event = getRequestEvent();
  const url = event.url;

  if (event.locals.user) {
    return {
      redirectTo: Route.dashboard,
      step: 'request',
      token: null,
      error: null,
    };
  }

  const token = url.searchParams.get('token');
  const step = url.searchParams.get('step');

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
});

// Form functions
export const login = form(
  z.object({
    email: z.string().email('Please enter a valid email address').min(3),
    password: z.string().min(1, 'Password is required'),
    redirectTo: z.string().optional(),
  }),
  async ({ email, password, redirectTo }, issue) => {
    const event = getRequestEvent();

    try {
      // Validate credentials
      const user = await validateCredentials(email, password, event.locals.db);

      if (!user) {
        invalid(issue.email('Invalid email or password'));
      }

      // Check if email is verified
      if (!user!.emailVerified) {
        // Use invalid() to show error in Input field
        // The UI will check the field issue message to show the Alert
        invalid(issue.email('Please verify your email address before logging in'));
      }

      // Create session and tokens
      const { accessToken, sessionId, expiresAt } = await createSession(
        user!.uuid,
        user!.email,
        user!.isAdmin || false,
        event.locals.db,
      );

      // Set authentication cookies
      setAuthCookies(event.cookies, accessToken, sessionId, expiresAt);

      // Return redirect info - client will handle it
      return {
        success: true,
        redirectTo: redirectTo || Route.home,
      };
    } catch (error) {
      if (error instanceof Response) {
        throw error; // Re-throw redirects
      }
      console.error('Login error:', error);
      invalid(issue.email('An unexpected error occurred. Please try again.'));
    }
  },
);

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
  event.locals.user = undefined;

  return {
    success: true,
    redirectTo: '/login',
  };
});

export const signup = form(
  z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .refine(
        (password) => {
          const hasUpperCase = /[A-Z]/.test(password);
          const hasLowerCase = /[a-z]/.test(password);
          const hasNumbers = /\d/.test(password);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
          return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
        },
        {
          message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        },
      ),
    confirmPassword: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
  async ({ email, password, confirmPassword, firstName, lastName }, issue) => {
    const event = getRequestEvent();

    // Validate passwords match
    if (password !== confirmPassword) {
      invalid(issue.confirmPassword('Passwords do not match'));
    }

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

      // Create user
      const userId = await createUser(
        email,
        password,
        firstName || undefined,
        lastName || undefined,
        event.locals.db,
      );

      // Send verification email
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
        return {
          success: false,
          redirectTo:
            '/verify-email?email=' + encodeURIComponent(email) + '&error=email_send_failed',
        };
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

    // Return redirect info
    return {
      success: true,
      redirectTo: '/verify-email?email=' + encodeURIComponent(email),
    };
  },
);

export const resendVerificationEmail = form(
  z.object({
    email: z.string().email('Email is required'),
  }),
  async ({ email }, issue) => {
    const event = getRequestEvent();

    const baseUrl = event.url.origin;
    const result = await resendVerificationEmailService(email, baseUrl, event.locals.db);

    if (!result.success) {
      invalid(issue.email(result.error || 'Failed to resend verification email'));
    }

    return {
      success: true,
      message: 'Verification email sent successfully',
      email,
    };
  },
);

export const verifyEmailLogin = form(
  z.object({
    userId: z.string(),
    email: z.string().email(),
    isAdmin: z.coerce.boolean().optional(),
  }),
  async ({ userId, email, isAdmin }, issue) => {
    const event = getRequestEvent();

    try {
      const userResult = await event.locals.db
        .select()
        .from(users)
        .where(eq(users.uuid, userId))
        .limit(1);

      const isAdminValue = userResult[0]?.isAdmin || isAdmin || false;

      const { accessToken, sessionId, expiresAt } = await createSession(
        userId,
        email,
        isAdminValue,
        event.locals.db,
      );

      setAuthCookies(event.cookies, accessToken, sessionId, expiresAt);
    } catch (error) {
      console.error('Auto-login error:', error);
      invalid(issue.userId('Failed to log in. Please try logging in manually.'));
    }

    return {
      success: true,
      redirectTo: '/dashboard?welcome=true&verified=true',
    };
  },
);

export const requestPasswordReset = form(
  z.object({
    email: z.string().email('Please enter a valid email address').min(3),
  }),
  async ({ email }, issue) => {
    const event = getRequestEvent();

    try {
      const result = await requestPasswordResetService(email, event.url.origin, event.locals.db);

      if (!result.success) {
        invalid(issue.email(result.error || 'Failed to request password reset'));
      }
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }

      console.error('Password reset request error:', error);
      invalid(issue.email('An unexpected error occurred. Please try again.'));
    }

    return {
      success: true,
      redirectTo: `${Route.reset}?step=sent`,
    };
  },
);

export const resetPassword = form(
  z.object({
    token: z.string().min(1, 'Invalid reset token'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .refine(
        (password) => {
          const hasUpperCase = /[A-Z]/.test(password);
          const hasLowerCase = /[a-z]/.test(password);
          const hasNumbers = /\d/.test(password);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
          return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
        },
        {
          message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        },
      ),
    confirmPassword: z.string(),
  }),
  async ({ token, password, confirmPassword }, issue) => {
    const event = getRequestEvent();

    // Validate passwords match
    if (password !== confirmPassword) {
      invalid(issue.confirmPassword('Passwords do not match'));
    }

    try {
      const result = await resetPasswordService(token, password, event.locals.db);

      if (!result.success) {
        const errorMessage =
          'error' in result ? result.error || 'Password reset failed' : 'Password reset failed';
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

    return {
      success: true,
      redirectTo:
        '/login?message=Password reset successfully. Please log in with your new password.',
    };
  },
);
