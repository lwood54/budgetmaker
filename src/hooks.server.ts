// src/hooks.server.ts
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import {
  verifyToken,
  shouldRefreshToken,
  refreshSession,
  setAuthCookies,
  clearAuthCookies,
} from '$lib/server/auth';
import { createD1Client } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { users } from '$lib/server/db/schema';

// Database setup hook - runs first to ensure db is available
const dbSetup: Handle = async ({ event, resolve }) => {
  // Check for Cloudflare D1 database (production/preview)
  if (event.platform?.env?.DB) {
    event.locals.db = createD1Client(event.platform.env.DB);
  } else {
    // Development mode - D1 simulation should be available
    throw new Error(
      'D1 database not available. Make sure you are running with wrangler dev or have D1 simulation set up.',
    );
  }

  return await resolve(event);
};

// Define your public routes - these don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/reset-password/complete',
  '/verify-email',
  '/about',
  '/contact',
];

// Helper function to check if a route is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_app') || // SvelteKit internal routes
      pathname.includes('.'), // Static files (css, js, images, etc.)
  );
}

const appConfig: Handle = async ({ event, resolve }) => {
  event.locals.baseUrl = event.url.origin;
  return await resolve(event);
};

// Authentication hook - handles token verification and refresh
const authenticate: Handle = async ({ event, resolve }) => {
  const accessToken = event.cookies.get('access_token');
  const sessionId = event.cookies.get('session_id');
  const isPublic = isPublicRoute(event.url.pathname);

  // Helper function to get user with admin status
  const getIsUserAdmin = async (userId: string) => {
    const userResult = await event.locals.db
      .select()
      .from(users)
      .where(eq(users.uuid, userId))
      .limit(1);

    return userResult[0]?.isAdmin || false;
  };

  // No authentication needed for public routes
  if (isPublic) {
    // Still try to set user if tokens exist (for conditional UI)
    if (accessToken && sessionId) {
      const tokenPayload = verifyToken(accessToken);
      if (tokenPayload) {
        const isAdmin = await getIsUserAdmin(tokenPayload.sub);
        event.locals.user = {
          userId: tokenPayload.sub,
          email: tokenPayload.email,
          sessionId: tokenPayload.sessionId,
          isAdmin,
        };
      }
    }
    return await resolve(event);
  }

  // Protected route - require authentication
  if (!accessToken || !sessionId) {
    throw redirect(302, '/login');
  }

  try {
    const tokenPayload = verifyToken(accessToken);

    if (tokenPayload) {
      // Token is valid, set user info
      const isAdmin = await getIsUserAdmin(tokenPayload.sub);
      event.locals.user = {
        userId: tokenPayload.sub,
        email: tokenPayload.email,
        sessionId: tokenPayload.sessionId,
        isAdmin,
      };

      // Check if we should refresh the token
      if (shouldRefreshToken(tokenPayload.exp)) {
        console.log('Refreshing token for user:', tokenPayload.email);

        const refreshResult = await refreshSession(sessionId, event.locals.db);

        if (refreshResult) {
          // Update cookies with new token
          setAuthCookies(
            event.cookies,
            refreshResult.accessToken,
            sessionId,
            refreshResult.expiresAt,
          );
          // Update isAdmin status from refresh result
          event.locals.user.isAdmin = refreshResult.isAdmin;
        } else {
          // Refresh failed - session is invalid
          console.log('Token refresh failed - clearing auth');
          clearAuthCookies(event.cookies);
          throw redirect(302, '/login');
        }
      }
    } else {
      // Token is invalid - try to refresh using session
      console.log('Invalid token - attempting refresh');

      const refreshResult = await refreshSession(sessionId, event.locals.db);

      if (refreshResult) {
        // Refresh successful - set new cookies and user info
        setAuthCookies(
          event.cookies,
          refreshResult.accessToken,
          sessionId,
          refreshResult.expiresAt,
        );

        const newTokenPayload = verifyToken(refreshResult.accessToken);
        if (newTokenPayload) {
          event.locals.user = {
            userId: newTokenPayload.sub,
            email: newTokenPayload.email,
            sessionId: newTokenPayload.sessionId,
            isAdmin: refreshResult.isAdmin,
          };
        }
      } else {
        // Refresh failed - clear everything and redirect
        console.log('Session refresh failed - clearing auth');
        clearAuthCookies(event.cookies);
        throw redirect(302, '/login');
      }
    }
  } catch (error) {
    // Any authentication error - clear cookies and redirect
    console.error('Authentication error:', error);
    clearAuthCookies(event.cookies);
    throw redirect(302, '/login');
  }

  const response = await resolve(event);

  // Optional: Add user info to response headers for debugging
  if (event.locals.user && process.env.NODE_ENV === 'development') {
    response.headers.set('x-user-id', event.locals.user.userId);
    response.headers.set('x-user-email', event.locals.user.email);
  }

  return response;
};

// Combine hooks in sequence - dbSetup must run first
export const handle = sequence(dbSetup, appConfig, authenticate);
