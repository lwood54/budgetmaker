import type { RequestHandler } from '@sveltejs/kit';
import { getAllUsers } from '$lib/server/users';
import { getIsAuthAdminConfirmed } from '$lib/server/auth';

export const GET: RequestHandler = async ({ locals, request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!getIsAuthAdminConfirmed(authHeader)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await getAllUsers(locals.db, true);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Cleanup failed', { status: 500 });
  }
};
