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
import { createD1Client, createLibSqlClient } from '$lib/server/db';
import { env } from '$env/dynamic/private';

// Create database client for local development
const localDb = env.DATABASE_URL ? createLibSqlClient(env.DATABASE_URL) : null;

// Database setup hook - runs first to ensure db is available
const dbSetup: Handle = async ({ event, resolve }) => {
  // Check for Cloudflare D1 database first (production)
  if (event.platform?.env?.DB) {
    event.locals.db = createD1Client(event.platform.env.DB);
  }
  // Fall back to local SQLite database
  else if (localDb) {
    event.locals.db = localDb;
  }
  // No database available - this is an error
  else {
    console.error('No database found. Make sure DATABASE_URL is set for local development.');
    throw new Error('Database connection not available');
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
      pathname.startsWith('/api/auth/') ||
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

  // No authentication needed for public routes
  if (isPublic) {
    // Still try to set user if tokens exist (for conditional UI)
    if (accessToken && sessionId) {
      const tokenPayload = verifyToken(accessToken);
      if (tokenPayload) {
        event.locals.user = {
          userId: tokenPayload.sub,
          email: tokenPayload.email,
          sessionId: tokenPayload.sessionId,
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
      event.locals.user = {
        userId: tokenPayload.sub,
        email: tokenPayload.email,
        sessionId: tokenPayload.sessionId,
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
// //////////////////////////////// OLD //////////////////////////////////////////
// // // import { redirect, type Handle } from '@sveltejs/kit';
// // import { type Handle } from '@sveltejs/kit';
// import { env } from '$env/dynamic/private';
// // import { createD1Client, createLibSqlClient } from '$lib/server/db';
// // // import { Route } from '$lib/constants/routes';
// // import { sequence } from '@sveltejs/kit/hooks';
// // // import { SECRET } from '$env/static/private';
// // // import { createHeaders, decryptToken, encryptToken, getMaxTokenAge, isTokenExpired, parseToken, shouldRefreshToken } from '$lib/helpers/auth';

// const db = env.DATABASE_URL ? createLibSqlClient(env.DATABASE_URL) : null;

// const dbSetup: Handle = async ({ event, resolve }) => {
//   if (event.platform?.env.DB) {
//     event.locals.db = createD1Client(event.platform.env.DB);
//   } else if (db) {
//     event.locals.db = db;
//   } else {
//     throw new Error('No database found');
//   }

//   const response = await resolve(event);
//   return response;
// };

// // const authenticate: Handle = async ({ event, resolve }) => {
// //   // const token = event.cookies.get('token');
// //   // const tokenExp = event.cookies.get('token_exp');
// //   // const publicRoutes: string[] = [
// //   //   Route.login,
// //   //   Route.signup,
// //   //   Route.home,
// //   //   Route.reset,
// //   //   Route.resetComplete,
// //   //   Route.verify
// //   // ];
// //   // if (!token && !tokenExp && !publicRoutes.includes(event.url.pathname)) {
// //   //   throw redirect(302, Route.login);
// //   // }
// //   // if (token && tokenExp) {
// //   //   if (isTokenExpired(Number(tokenExp))) {
// //   //     event.cookies.delete('token', { path: '/' });
// //   //     event.cookies.delete('token_exp', { path: '/' });
// //   //     event.locals.user = undefined;
// //   //     throw redirect(302, Route.login);
// //   //   }
// //   //   if (shouldRefreshToken(Number(tokenExp))) {
// //   //     try {
// //   //       const response = await fetch(Api.auth.refresh(), {
// //   //         method: 'POST',
// //   //         headers: createHeaders({ Authorization: decryptToken(token, SECRET) })
// //   //       });
// //   //       if (response.ok) {
// //   //         const { token: newToken } = await response.json();
// //   //         const encryptedToken = encryptToken(newToken, SECRET);
// //   //         const maxAge = getMaxTokenAge(encryptedToken);
// //   //         event.cookies.set('token', encryptedToken.token, {
// //   //           httpOnly: true,
// //   //           secure: true,
// //   //           sameSite: 'strict',
// //   //           path: '/',
// //   //           maxAge
// //   //         });
// //   //         event.cookies.set('token_exp', String(encryptedToken.exp), {
// //   //           httpOnly: true,
// //   //           secure: true,
// //   //           sameSite: 'strict',
// //   //           path: '/',
// //   //           maxAge
// //   //         });
// //   //       }
// //   //     } catch (error) {
// //   //       console.error('Token refresh failed:', error);
// //   //     }
// //   //   }
// //   //   const decryptedToken = decryptToken(token, SECRET);
// //   //   const userData = parseToken(decryptedToken);
// //   //   event.locals.user = {
// //   //     userId: userData.sub,
// //   //     email: userData.email
// //   //   };
// //   // }
// //   return resolve(event);
// // };

// // export const otherStuff: Handle = async ({ event, resolve }) => {
// //   // CAN DO OTHER STUFF...delete if nothing needed
// //   const result = await resolve(event);
// //   return result;
// // };

// // export const handle = sequence(dbSetup, authenticate, otherStuff);
