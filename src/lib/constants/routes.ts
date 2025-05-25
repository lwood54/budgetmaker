export const Route = {
  budgets: '/budgets',
  budget: (budgetUUID: string) => `/budgets/${budgetUUID}`,
  categories: (budgetUUID: string) => `/budgets/${budgetUUID}/categories`,
  calculators: '/calculators',
  dashboard: '/dashboard',
  home: '/',
  login: '/login',
  logout: '/logout',
  paydown: '/paydown',
  privacy: '/privacy',
  reset: '/reset',
  resetComplete: '/reset/complete',
  signup: '/signup',
  terms: '/terms',
  verifyEmail: '/verify-email',
} as const;

///// OLD WAY -- rethink this with new setup
// const PRODUCTION_URL = 'https://budget-planner-be.fly.dev';
// const DEV_URL = 'http://127.0.0.1:8080';
// export const ROOT_URL = PUBLIC_ENV === 'development' ? DEV_URL : PRODUCTION_URL;
// export const Api = {
//   auth: {
//     login: () => `${ROOT_URL}/login`,
//     refresh: () => `${ROOT_URL}/refresh`,
//     logout: () => `${ROOT_URL}/logout`,
//     reset: ({ isComplete }: { isComplete: boolean }) =>
//       `${ROOT_URL}/reset${isComplete ? '/complete' : ''}`,
//     signup: () => `${ROOT_URL}/signup`,
//     verify: () => `${ROOT_URL}/verify`
//   },
//   budgets: (budgetUUID?: string | null) =>
//     `${ROOT_URL}/budgets${budgetUUID ? `/${budgetUUID}` : ''}`,
//   budgetItems: (budgetUUID: string, itemUUID?: string | null) =>
//     `${ROOT_URL}/budgets/${budgetUUID}/items${itemUUID ? `/${itemUUID}` : ''}`,
//   categories: (budgetUUID: string, categoryUUID?: string | null) =>
//     `${ROOT_URL}/budgets/${budgetUUID}/categories${categoryUUID ? `/${categoryUUID}` : ''}`
// } as const;
