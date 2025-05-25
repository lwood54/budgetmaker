// src/routes/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { validateCredentials, createSession, setAuthCookies } from '$lib/server/auth';
import { Route } from '$lib/constants/routes';

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect if already logged in
  if (locals.user) {
    throw redirect(302, Route.dashboard);
  }
};

export const actions: Actions = {
  login: async ({ request, cookies, locals, url }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const redirectTo = url.searchParams.get('redirectTo') || Route.dashboard;

    // Basic validation
    if (!email || !password) {
      return fail(400, {
        error: 'Email and password are required',
        email: email || '',
      });
    }

    if (!email.includes('@') || email.length < 3) {
      return fail(400, {
        error: 'Please enter a valid email address',
        email,
      });
    }

    if (password.length < 1) {
      return fail(400, {
        error: 'Password is required',
        email,
      });
    }

    try {
      // Validate credentials
      const user = await validateCredentials(email, password, locals.db);

      if (!user) {
        return fail(400, {
          error: 'Invalid email or password',
          email,
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
        locals.db,
      );

      // Set authentication cookies
      setAuthCookies(cookies, accessToken, sessionId, expiresAt);

      console.log(`User ${user.email} logged in successfully`);

      // Redirect to intended page or dashboard
      throw redirect(302, redirectTo);
    } catch (error) {
      console.error('Login error:', error);

      // Don't expose internal errors to user
      return fail(500, {
        error: 'An unexpected error occurred. Please try again.',
        email,
      });
    }
  },
};
