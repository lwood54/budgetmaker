// src/routes/logout/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteSession, deleteAllUserSessions, clearAuthCookies } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  // Auto-logout when accessing this page
  if (locals.user?.sessionId) {
    try {
      await deleteSession(locals.user.sessionId, locals.db);
      console.log(`Session ${locals.user.sessionId} deleted for user ${locals.user.email}`);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  clearAuthCookies(cookies);
  throw redirect(302, '/login?message=logged-out');
};

export const actions: Actions = {
  // Standard logout - clears current session only
  logout: async ({ locals, cookies }) => {
    if (locals.user?.sessionId) {
      try {
        await deleteSession(locals.user.sessionId, locals.db);
        console.log(`User ${locals.user.email} logged out`);
      } catch (error) {
        console.error('Error deleting session during logout:', error);
      }
    }

    clearAuthCookies(cookies);
    throw redirect(302, '/login?message=logged-out');
  },

  // Logout from all devices - clears all user sessions
  logoutAll: async ({ locals, cookies }) => {
    if (locals.user?.userId) {
      try {
        await deleteAllUserSessions(locals.user.userId, locals.db);
        console.log(`All sessions deleted for user ${locals.user.email}`);
      } catch (error) {
        console.error('Error deleting all sessions:', error);
      }
    }

    clearAuthCookies(cookies);
    throw redirect(302, '/login?message=logged-out-all');
  },
};
