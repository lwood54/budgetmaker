import { BASE_HEADERS } from '$lib/constants/auth';

export const createHeaders = (additionalHeaders: Record<string, string> = {}) => {
  return {
    ...BASE_HEADERS,
    ...additionalHeaders,
  };
};
