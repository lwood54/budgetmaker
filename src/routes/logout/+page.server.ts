import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { deleteSession, clearAuthCookies } from '$lib/server/auth';
import { Route } from '$lib/constants/routes';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (locals.user?.sessionId) {
    try {
      await deleteSession(locals.user.sessionId, locals.db);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  clearAuthCookies(cookies);
  throw redirect(302, Route.login);
};
