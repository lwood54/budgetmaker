import type { Actions } from '@sveltejs/kit';
import { performCleanup } from '$lib/server/userCleanup';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  default: async ({ locals }) => {
    try {
      const result = await performCleanup(locals.db);

      return {
        success: true,
        deletedCount: result.deletedCount,
        deletedTokenCount: result.deletedTokenCount,
        timestamp: result.timestamp,
      };
    } catch (error) {
      return fail(500, {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  },
};
