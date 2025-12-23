import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteSession, clearAuthCookies } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (locals.user?.sessionId) {
    try {
      await deleteSession(locals.user.sessionId, locals.db);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  clearAuthCookies(cookies);
  locals.user = undefined;
  throw redirect(302, '/login');
};

export const actions: Actions = {
  default: async ({ locals, cookies }) => {
    if (locals.user?.sessionId) {
      try {
        await deleteSession(locals.user.sessionId, locals.db);
      } catch (error) {
        console.error('Error deleting session during logout:', error);
      }
    }

    clearAuthCookies(cookies);
    locals.user = undefined;
    throw redirect(302, '/login');
  },
};
