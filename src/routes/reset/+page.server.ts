import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPassword,
} from '$lib/server/passwordReset';
import { Route } from '$lib/constants/routes';

export const load: PageServerLoad = async ({ url, locals }) => {
  if (locals.user) {
    throw redirect(302, Route.dashboard);
  }

  const token = url.searchParams.get('token');
  const step = url.searchParams.get('step');

  if (token) {
    const result = await verifyPasswordResetToken(token, locals.db);

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
};

export const actions: Actions = {
  request: async ({ request, locals, url }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();

    if (!email) {
      return fail(400, {
        error: 'Email is required',
        step: 'request',
      });
    }

    if (!email.includes('@') || email.length < 3) {
      return fail(400, {
        error: 'Please enter a valid email address',
        email,
        step: 'request',
      });
    }

    try {
      const result = await requestPasswordReset(email, url.origin, locals.db);

      if (!result.success) {
        return fail(500, {
          error: result.error,
          email,
          step: 'request',
        });
      }
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }

      console.error('Password reset request error:', error);
      return fail(500, {
        error: 'An unexpected error occurred. Please try again.',
        email,
        step: 'request',
      });
    }
    throw redirect(302, `${Route.reset}?step=sent`);
  },

  reset: async ({ request, locals }) => {
    const formData = await request.formData();
    const token = formData.get('token')?.toString();
    const password = formData.get('password')?.toString();
    const confirmPassword = formData.get('confirmPassword')?.toString();

    if (!token) {
      return fail(400, {
        error: 'Invalid reset token',
        step: 'request',
      });
    }

    if (!password || !confirmPassword) {
      return fail(400, {
        error: 'Password and confirmation are required',
        step: 'reset',
        token,
      });
    }

    if (password !== confirmPassword) {
      return fail(400, {
        error: 'Passwords do not match',
        step: 'reset',
        token,
      });
    }

    if (password.length < 8) {
      return fail(400, {
        error: 'Password must be at least 8 characters long',
        step: 'reset',
        token,
      });
    }

    // Password strength validation (same as signup)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return fail(400, {
        error:
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        step: 'reset',
        token,
      });
    }

    try {
      const result = await resetPassword(token, password, locals.db);

      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : 'Password reset failed';
        const isTokenError =
          errorMessage?.includes('token') ||
          errorMessage?.includes('expired') ||
          errorMessage?.includes('Invalid');

        return fail(400, {
          error: errorMessage,
          step: isTokenError ? 'request' : 'reset',
          token: isTokenError ? null : token,
        });
      }
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }

      console.error('Password reset error:', error);
      return fail(500, {
        error: 'An unexpected error occurred. Please try again.',
        step: 'reset',
        token,
      });
    }
    throw redirect(
      302,
      '/login?message=Password reset successfully. Please log in with your new password.',
    );
  },
};
