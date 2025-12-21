import { query, getRequestEvent, form } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { z } from 'zod';
import {
  getProjectionsByUserId,
  getProjectionById,
  createProjectionWithStructure,
  verifyProjectionOwnership,
} from './projections';
import { projections } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PaydownStrategy } from '$lib/server/db/schema/projections';

// Query functions
export const getProjections = query(async () => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return [];
  }

  return await getProjectionsByUserId(event.locals.db, event.locals.user.userId);
});

export const getProjection = query(z.string(), async (projectionId) => {
  const event = getRequestEvent();

  if (!event.locals.user?.userId) {
    return null;
  }

  const projection = await getProjectionById(event.locals.db, projectionId);

  if (!projection) {
    return null;
  }

  // Ensure the user owns this projection
  if (projection.userId !== event.locals.user.userId) {
    return null;
  }

  return projection;
});

// Form functions
export const createProjection = form(
  z.object({
    title: z.string().min(1, 'Projection title is required'),
    paydownStrategy: z.enum([
      'snowball',
      'avalanche',
      'highest_balance',
      'lowest_balance',
      'custom',
    ]),
    startYear: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
  async ({ title, paydownStrategy, startYear }, issue) => {
    const event = getRequestEvent();
    if (!event.locals.user?.userId) {
      invalid(issue.title('Unauthorized'));
    }

    const projectionId = await createProjectionWithStructure(
      event.locals.db,
      event.locals.user.userId,
      title,
      paydownStrategy as PaydownStrategy,
      startYear,
    );

    getProjections().refresh();
    return {
      success: true,
      projectionId,
    };
  },
);

export const deleteProjection = form(
  z.object({
    projectionId: z.string().min(1, 'Projection ID is required'),
  }),
  async ({ projectionId }, issue) => {
    const event = getRequestEvent();

    if (!event.locals.user?.userId) {
      invalid(issue.projectionId('Unauthorized'));
    }

    // Verify the user owns the projection
    const ownsProjection = await verifyProjectionOwnership(
      event.locals.db,
      projectionId,
      event.locals.user.userId,
    );

    if (!ownsProjection) {
      invalid(issue.projectionId('Projection not found or unauthorized'));
    }

    // Delete the projection (cascade will handle sections, intervals, groupItems, and balances)
    await event.locals.db.delete(projections).where(eq(projections.uuid, projectionId));

    getProjections().refresh();
    return {
      success: true,
    };
  },
);
