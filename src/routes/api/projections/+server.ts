import type { RequestHandler } from '@sveltejs/kit';
import { getProjectionsByUserId, createProjectionWithStructure } from '$lib/api/projections';
import type { PaydownStrategy } from '$lib/server/db/schema/projections';

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user?.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userProjections = await getProjectionsByUserId(locals.db, locals.user.userId);
  return new Response(JSON.stringify(userProjections), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user?.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      paydownStrategy?: string;
      startYear?: number | string;
    };
    const { title, paydownStrategy, startYear } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return new Response('Projection title is required', { status: 400 });
    }

    const validStrategies: PaydownStrategy[] = [
      'snowball',
      'avalanche',
      'highest_balance',
      'lowest_balance',
      'custom',
    ];
    if (!paydownStrategy || !validStrategies.includes(paydownStrategy as PaydownStrategy)) {
      return new Response('Valid paydown strategy is required', { status: 400 });
    }

    const year =
      startYear !== undefined
        ? typeof startYear === 'number'
          ? startYear
          : parseInt(String(startYear), 10)
        : new Date().getFullYear();
    if (isNaN(year) || year < 2000 || year > 2100) {
      return new Response('Invalid start year', { status: 400 });
    }

    const projectionId = await createProjectionWithStructure(
      locals.db,
      locals.user.userId,
      title.trim(),
      paydownStrategy as PaydownStrategy,
      year,
    );

    return new Response(
      JSON.stringify({
        success: true,
        projectionId,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error creating projection:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
