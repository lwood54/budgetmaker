export const Route = {
  about: '/about',
  budgets: '/budgets',
  budget_new: '/budgets/new',
  budget: (budgetUUID: string) => `/budgets/${budgetUUID}`,
  budget_edit: (budgetUUID: string) => `/budgets/${budgetUUID}/edit`,
  category_purchases: (budgetUUID: string, categoryUUID: string) =>
    `/budgets/${budgetUUID}/categories/${categoryUUID}`,
  category_edit: (budgetUUID: string, categoryUUID: string) =>
    `/budgets/${budgetUUID}/categories/${categoryUUID}/edit`,
  category_new: (budgetUUID: string) => `/budgets/${budgetUUID}/categories/new`,
  categories: (budgetUUID: string) => `/budgets/${budgetUUID}/categories`,
  item_edit: (budgetUUID: string, itemUUID: string) =>
    `/budgets/${budgetUUID}/items/${itemUUID}/edit`,
  item_new: (budgetUUID: string) => `/budgets/${budgetUUID}/items/new`,
  calculators: '/calculators',
  contact: '/contact',
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
