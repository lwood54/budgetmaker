import type { RequestHandler } from '@sveltejs/kit';
import { performCleanup } from '$lib/server/userCleanup';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ locals, request }) => {
  const authHeader = request.headers.get('Authorization');
  const adminKey = env.ADMIN_API_KEY;

  if (!authHeader || authHeader !== `Bearer ${adminKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await performCleanup(locals.db);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response('Cleanup failed', { status: 500 });
  }
};
