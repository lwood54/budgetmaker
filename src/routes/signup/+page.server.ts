// src/routes/signup/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createUser } from '$lib/server/auth';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { Route } from '$lib/constants/routes';
import { sendVerificationEmail } from '$lib/server/emailVerification';

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect if already logged in
  if (locals.user) {
    throw redirect(302, Route.dashboard);
  }
};

export const actions: Actions = {
  signup: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const confirmPassword = formData.get('confirmPassword')?.toString();
    const firstName = formData.get('firstName')?.toString();
    const lastName = formData.get('lastName')?.toString();

    // Basic validation
    if (!email || !password) {
      return fail(400, {
        error: 'Email and password are required',
        email: email || '',
        firstName: firstName || '',
        lastName: lastName || '',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(400, {
        error: 'Please enter a valid email address',
        email,
        firstName: firstName || '',
        lastName: lastName || '',
      });
    }

    // Password validation
    if (password.length < 8) {
      return fail(400, {
        error: 'Password must be at least 8 characters long',
        email,
        firstName: firstName || '',
        lastName: lastName || '',
      });
    }

    if (password !== confirmPassword) {
      return fail(400, {
        error: 'Passwords do not match',
        email,
        firstName: firstName || '',
        lastName: lastName || '',
      });
    }

    // Check for strong password (optional - adjust as needed)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return fail(400, {
        error:
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        email,
        firstName: firstName || '',
        lastName: lastName || '',
      });
    }

    try {
      // Check if user already exists
      const existingUser = await locals.db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0) {
        return fail(400, {
          error: 'An account with this email already exists',
          email,
          firstName: firstName || '',
          lastName: lastName || '',
        });
      }

      // Create the user
      const userId = await createUser(
        email,
        password,
        firstName || undefined,
        lastName || undefined,
        locals.db,
      );

      console.log(`New user created: ${email} (${userId})`);

      try {
        await sendVerificationEmail(
          email.toLowerCase(),
          userId,
          firstName || undefined,
          locals.baseUrl,
          locals.db,
        );
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);

        throw redirect(
          302,
          '/verify-email?email=' + encodeURIComponent(email) + '&error=email_send_failed',
        );
      }
    } catch (error) {
      console.error('Signup error:', error);

      // Handle specific database errors
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        return fail(400, {
          error: 'An account with this email already exists',
          email,
          firstName: firstName || '',
          lastName: lastName || '',
        });
      }

      return fail(500, {
        error: 'An unexpected error occurred. Please try again.',
        email,
        firstName: firstName || '',
        lastName: lastName || '',
      });
    }
    // NOTE: if successful send to verify email, redirect to verify email page
    // throw must be outside try/catch unless you really want to catch the error
    throw redirect(302, '/verify-email?email=' + encodeURIComponent(email));
  },
};
