import type { PaydownDebt } from './localStorage';

/**
 * Sort debts by priority rules for snowball calculation
 * - Priority 1 = highest priority, receives snowball first
 * - Priority 0 = skip snowball (sorted to end)
 * - Same priority: sorted by balance (lowest first)
 *
 * @param debts - Array of debts to sort
 * @param currentBalances - Optional Map of debtId -> current balance (defaults to debt.amount)
 * @returns Sorted array of debts
 */
export function sortDebtsByPriority(
  debts: PaydownDebt[],
  currentBalances?: Map<string, number>,
): PaydownDebt[] {
  return [...debts].sort((a, b) => {
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;

    // Get balances - use currentBalances if provided, otherwise use debt.amount
    const getBalance = (debt: PaydownDebt) => currentBalances?.get(debt.id) ?? debt.amount;

    // If both have priority 0, sort by balance
    if (priorityA === 0 && priorityB === 0) {
      return getBalance(a) - getBalance(b);
    }

    // Priority 0 goes to the end
    if (priorityA === 0) return 1;
    if (priorityB === 0) return -1;

    // Sort by priority (lower number = higher priority)
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Same priority: sort by balance (lowest first)
    return getBalance(a) - getBalance(b);
  });
}
