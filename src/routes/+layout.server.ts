import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  try {
    const user = locals.user || null;
    return {
      user,
    };
  } catch (error) {
    console.error('[+layout.server.ts] Error in load:', error);
    return {
      user: null,
    };
  }
};
