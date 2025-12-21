import type { RequestHandler } from '@sveltejs/kit';
import { getProjectionById, verifyProjectionOwnership } from '$lib/api/projections';
import { projections } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, params }) => {
  if (!locals.user?.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { uuid: projectionId } = params;

  if (!projectionId) {
    return new Response('Projection ID is required', { status: 400 });
  }

  const projection = await getProjectionById(locals.db, projectionId);

  if (!projection) {
    return new Response('Projection not found', { status: 404 });
  }

  // Verify ownership
  if (projection.userId !== locals.user.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  return new Response(JSON.stringify(projection), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.user?.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { uuid: projectionId } = params;

  if (!projectionId) {
    return new Response('Projection ID is required', { status: 400 });
  }

  // Verify ownership
  const ownsProjection = await verifyProjectionOwnership(
    locals.db,
    projectionId,
    locals.user.userId,
  );

  if (!ownsProjection) {
    return new Response('Projection not found or unauthorized', { status: 404 });
  }

  // Delete the projection (cascade will handle sections, intervals, groupItems, and balances)
  await locals.db.delete(projections).where(eq(projections.uuid, projectionId));

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
