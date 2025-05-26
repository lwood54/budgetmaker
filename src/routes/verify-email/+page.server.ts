import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { verifyEmailToken, resendVerificationEmail } from '$lib/server/emailVerification';
import { createSession, setAuthCookies } from '$lib/server/auth';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { Route } from '$lib/constants/routes';

export const load: PageServerLoad = async ({ url, locals, cookies }) => {
  const token = url.searchParams.get('token');
  const email = url.searchParams.get('email');
  const error = url.searchParams.get('error');

  // If user is already logged in, redirect to dashboard
  if (locals.user) {
    throw redirect(302, Route.dashboard);
  }

  // If token is provided, attempt verification
  if (token) {
    const result = await verifyEmailToken(token, locals.db);

    if (result.success) {
      // Get user details for auto-login
      const userResult = await locals.db
        .select()
        .from(users)
        .where(eq(users.uuid, result.userId!))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];

        // Automatically create session and set cookies upon successful verification
        try {
          const { accessToken, sessionId, expiresAt } = await createSession(
            user.uuid,
            user.email,
            user.isAdmin || false,
            locals.db,
          );

          setAuthCookies(cookies, accessToken, sessionId, expiresAt);
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
        throw redirect(302, '/dashboard?welcome=true&verified=true');
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
};

export const actions: Actions = {
  resend: async ({ request, locals, url }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();

    if (!email) {
      return fail(400, {
        error: 'Email is required',
      });
    }

    const baseUrl = url.origin;
    const result = await resendVerificationEmail(email, baseUrl, locals.db);

    if (!result.success) {
      return fail(400, {
        error: result.error,
        email,
      });
    }

    return {
      success: true,
      message: 'Verification email sent successfully',
      email,
    };
  },

  login: async ({ request, cookies, locals }) => {
    const formData = await request.formData();
    const userId = formData.get('userId')?.toString();
    const email = formData.get('email')?.toString();

    if (!userId || !email) {
      return fail(400, {
        error: 'Invalid request',
      });
    }

    try {
      const userResult = await locals.db
        .select()
        .from(users)
        .where(eq(users.uuid, userId))
        .limit(1);

      const isAdmin = userResult[0]?.isAdmin || false;

      const { accessToken, sessionId, expiresAt } = await createSession(
        userId,
        email,
        isAdmin,
        locals.db,
      );

      setAuthCookies(cookies, accessToken, sessionId, expiresAt);
    } catch (error) {
      console.error('Auto-login error:', error);
      return fail(500, {
        error: 'Failed to log in. Please try logging in manually.',
      });
    }
    throw redirect(302, '/dashboard?welcome=true&verified=true');
  },
};
