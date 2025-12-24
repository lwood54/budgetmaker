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
import { Route } from '$lib/constants/routes';

const dbSetup: Handle = async ({ event, resolve }) => {
  if (event.platform?.env?.DB) {
    event.locals.db = createD1Client(event.platform.env.DB);
  } else {
    throw new Error(
      'D1 database not available. Make sure you are running with wrangler dev or have D1 simulation set up.',
    );
  }

  return await resolve(event);
};

// NOTE: no authentication required for these routes
const PUBLIC_ROUTES = [
  Route.home,
  Route.login,
  Route.signup,
  Route.reset,
  Route.resetComplete,
  Route.verifyEmail,
  Route.about,
  Route.contact,
  Route.calculators,
];

// NOTE: helps check public api routes that will be used externally
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_app') ||
      pathname.includes('.'),
  );
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin/');
}

const appConfig: Handle = async ({ event, resolve }) => {
  event.locals.baseUrl = event.url.origin;
  return await resolve(event);
};

// NOTE: Authentication hook - handles token verification and refresh
const authenticate: Handle = async ({ event, resolve }) => {
  const accessToken = event.cookies.get('access_token');
  const sessionId = event.cookies.get('session_id');

  if (isPublicRoute(event.url.pathname)) {
    if (accessToken && sessionId) {
      const tokenPayload = verifyToken(accessToken);
      if (tokenPayload) {
        event.locals.user = {
          userId: tokenPayload.sub,
          email: tokenPayload.email,
          sessionId: tokenPayload.sessionId,
          isAdmin: tokenPayload.isAdmin,
        };
      }
    }
    const response = await resolve(event);
    return response;
  }

  // Protected route - require authentication
  if (!accessToken || !sessionId) {
    throw redirect(302, Route.login);
  }

  try {
    const tokenPayload = verifyToken(accessToken);

    if (tokenPayload) {
      event.locals.user = {
        userId: tokenPayload.sub,
        email: tokenPayload.email,
        sessionId: tokenPayload.sessionId,
        isAdmin: tokenPayload.isAdmin,
      };

      if (shouldRefreshToken(tokenPayload.exp)) {
        const refreshResult = await refreshSession(sessionId, event.locals.db);

        if (refreshResult) {
          // NOTE: update cookies with new token
          setAuthCookies(
            event.cookies,
            refreshResult.accessToken,
            sessionId,
            refreshResult.expiresAt,
          );
          event.locals.user.isAdmin = refreshResult.isAdmin;
        } else {
          clearAuthCookies(event.cookies);
          throw redirect(302, '/login');
        }
      }
    } else {
      // NOTE: token is invalid - try to refresh using session
      const refreshResult = await refreshSession(sessionId, event.locals.db);

      if (refreshResult) {
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
            isAdmin: newTokenPayload.isAdmin,
          };
        }
      } else {
        clearAuthCookies(event.cookies);
        throw redirect(302, '/login');
      }
    }
  } catch (error) {
    clearAuthCookies(event.cookies);
    throw redirect(302, Route.login);
  }

  if (isAdminRoute(event.url.pathname) && !event.locals.user?.isAdmin) {
    throw redirect(302, Route.dashboard);
  }

  const response = await resolve(event);

  if (event.locals.user && process.env.NODE_ENV === 'development') {
    response.headers.set('x-user-id', event.locals.user.userId);
    response.headers.set('x-user-email', event.locals.user.email);
  }

  return response;
};

// NOTE: Combine hooks in sequence - dbSetup must run first
export const handle = sequence(dbSetup, appConfig, authenticate);
