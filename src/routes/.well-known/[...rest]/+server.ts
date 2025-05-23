import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ params }) => {
  console.log(`Intercepted some chrome extension .well-known request: ${params.rest}`);
  return new Response(null, { status: 204 });
};
