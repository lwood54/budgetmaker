import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { validateCredentials, createSession, setAuthCookies } from '$lib/server/auth';
import { Route } from '$lib/constants/routes';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) {
    throw redirect(302, Route.home);
  }

  const message = url.searchParams.get('message');
  return {
    message,
  };
};

export const actions: Actions = {
  login: async ({ request, cookies, locals, url }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const redirectTo = url.searchParams.get('redirectTo') || Route.home;

    // Basic validation
    if (!email || !password) {
      return fail(400, {
        error: 'Email and password are required',
        email: email || '',
        needsVerification: false,
      });
    }

    if (!email.includes('@') || email.length < 3) {
      return fail(400, {
        error: 'Please enter a valid email address',
        email,
        needsVerification: false,
      });
    }

    if (password.length < 1) {
      return fail(400, {
        error: 'Password is required',
        email,
        needsVerification: false,
      });
    }

    try {
      // Validate credentials
      const user = await validateCredentials(email, password, locals.db);

      if (!user) {
        return fail(400, {
          error: 'Invalid email or password',
          email,
          needsVerification: false,
        });
      }

      // Check if email is verified (optional - remove if you don't want email verification)
      if (!user.emailVerified) {
        return fail(400, {
          error: 'Please verify your email address before logging in',
          email,
          needsVerification: true,
        });
      }

      // Create session and tokens
      const { accessToken, sessionId, expiresAt } = await createSession(
        user.uuid,
        user.email,
        user.isAdmin || false,
        locals.db,
      );

      // Set authentication cookies
      setAuthCookies(cookies, accessToken, sessionId, expiresAt);
    } catch (error) {
      console.error('Login error:', error);

      // Don't expose internal errors to user
      return fail(500, {
        error: 'An unexpected error occurred. Please try again.',
        email,
        needsVerification: false,
      });
    }
    throw redirect(302, redirectTo);
  },
};
