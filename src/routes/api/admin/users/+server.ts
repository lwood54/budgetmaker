import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getAllUsers } from '$lib/server/users';

export const GET: RequestHandler = async ({ locals, request }) => {
  const authHeader = request.headers.get('Authorization');
  const adminKey = env.ADMIN_API_KEY;
  console.info('adminKey ---------->', adminKey);
  console.info('authHeader ---------->', authHeader);

  if (!authHeader || authHeader !== `Bearer ${adminKey}`) {
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
