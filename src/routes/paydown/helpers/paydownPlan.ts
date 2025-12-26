import type { PaydownDebt, DebtType } from './localStorage';
import type { MonthlyIncome } from './localStorage';
import type { RecurringExpense } from './localStorage';

export interface PaymentMonth {
  year: number;
  month: number; // 0-11 (JavaScript month index)
  monthName: string; // e.g., "January 2024"
}

export interface DebtPayment {
  debtId: string;
  debtName: string;
  balance: number;
  payment: number; // Actual payment amount (principal + interest, may be less than planned payment when paid off)
  interest: number;
  principal: number;
  isPaidOff: boolean;
}

export interface MonthlyPaymentPlan {
  paymentMonth: PaymentMonth;
  debtPayments: DebtPayment[];
  totalPayment: number;
  totalInterest: number;
  totalPrincipal: number;
  incomes: MonthlyIncome[];
  totalIncome: number;
  recurringExpenses: RecurringExpense[];
  totalRecurringExpenses: number;
  remainingBalance: number;
}

/**
 * Get month/year string from a date
 */
function getMonthYearString(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Calculate a single month's payment for a debt based on its type
 * Most loan types use standard amortization (interest first, then principal)
 * Credit cards use the same formula
 * @param type - Debt type (currently all types use the same formula, but kept for future expansion)
 */
function calculateDebtPaymentByType(
  balance: number,
  interestRate: number,
  monthlyPayment: number,
  _type: DebtType, // Prefixed with _ to indicate intentionally unused for now
): {
  interest: number;
  principal: number;
  newBalance: number;
  isPaidOff: boolean;
  actualPayment: number; // Actual payment amount (principal + interest, capped at monthlyPayment)
} {
  const monthlyInterestRate = interestRate / 100 / 12;

  // Calculate interest that accrues on the current balance
  const interest = balance * monthlyInterestRate;

  // Principal is the portion of payment that goes toward reducing the balance
  // Payment first covers interest, then the remainder goes to principal
  // Principal cannot exceed the current balance
  const principal = Math.min(monthlyPayment - interest, balance);

  // New balance is reduced only by the principal portion
  const newBalance = Math.max(0, balance - principal);
  const isPaidOff = newBalance <= 0.01; // Consider paid off if balance is less than 1 cent

  // Actual payment is the amount actually needed: principal + interest
  // When paid off, this will be less than or equal to monthlyPayment
  const actualPayment = principal + interest;

  return {
    interest: Math.round(interest * 100) / 100,
    principal: Math.round(principal * 100) / 100,
    newBalance: Math.round(newBalance * 100) / 100,
    isPaidOff,
    actualPayment: Math.round(actualPayment * 100) / 100,
  };
}

/**
 * Calculate payment for credit card debt
 * Uses standard amortization formula
 */
function calculateCreditCardPayment(balance: number, interestRate: number, monthlyPayment: number) {
  return calculateDebtPaymentByType(balance, interestRate, monthlyPayment, 'credit-card');
}

/**
 * Calculate payment for car loan
 * Uses standard amortization formula
 */
function calculateCarLoanPayment(balance: number, interestRate: number, monthlyPayment: number) {
  return calculateDebtPaymentByType(balance, interestRate, monthlyPayment, 'car');
}

/**
 * Calculate payment for mortgage
 * Uses standard amortization formula
 */
function calculateMortgagePayment(balance: number, interestRate: number, monthlyPayment: number) {
  return calculateDebtPaymentByType(balance, interestRate, monthlyPayment, 'mortgage');
}

/**
 * Calculate payment for student loan
 * Uses standard amortization formula
 */
function calculateStudentLoanPayment(
  balance: number,
  interestRate: number,
  monthlyPayment: number,
) {
  return calculateDebtPaymentByType(balance, interestRate, monthlyPayment, 'student-loan');
}

/**
 * Calculate payment for personal loan
 * Uses standard amortization formula
 */
function calculatePersonalLoanPayment(
  balance: number,
  interestRate: number,
  monthlyPayment: number,
) {
  return calculateDebtPaymentByType(balance, interestRate, monthlyPayment, 'personal-loan');
}

/**
 * Calculate payment for other loan types
 * Uses standard amortization formula
 */
function calculateOtherLoanPayment(balance: number, interestRate: number, monthlyPayment: number) {
  return calculateDebtPaymentByType(balance, interestRate, monthlyPayment, 'other');
}

/**
 * Route to the appropriate calculation function based on debt type
 */
function calculateDebtPayment(
  balance: number,
  interestRate: number,
  monthlyPayment: number,
  type: DebtType,
) {
  switch (type) {
    case 'credit-card':
      return calculateCreditCardPayment(balance, interestRate, monthlyPayment);
    case 'car':
      return calculateCarLoanPayment(balance, interestRate, monthlyPayment);
    case 'mortgage':
      return calculateMortgagePayment(balance, interestRate, monthlyPayment);
    case 'student-loan':
      return calculateStudentLoanPayment(balance, interestRate, monthlyPayment);
    case 'personal-loan':
      return calculatePersonalLoanPayment(balance, interestRate, monthlyPayment);
    case 'other':
    default:
      return calculateOtherLoanPayment(balance, interestRate, monthlyPayment);
  }
}

/**
 * Recalculate plan from a specific month forward
 * Used when user edits payments - only recalculates current and future months
 * @param manuallyEditedPayments - Record of all manually edited payments across all months to preserve
 */
export function recalculatePlanFromMonth(
  plan: MonthlyPaymentPlan[],
  fromMonthIndex: number,
  updatedPayments: Map<string, number>, // debtId -> new payment amount for the update month
  debts: PaydownDebt[],
  incomes: MonthlyIncome[],
  recurringExpenses: RecurringExpense[],
  additionalSnowball: number,
  manuallyEditedPayments: Record<number, Record<string, number>> = {}, // monthIndex -> debtId -> payment
): MonthlyPaymentPlan[] {
  if (fromMonthIndex >= plan.length) return plan;

  // Create a copy of the plan up to (but not including) the update month
  const updatedPlan = [...plan.slice(0, fromMonthIndex)];

  // Get balances from the month before the update (or initial balances)
  const currentBalances = new Map<string, number>();
  const currentPayments = new Map<string, number>();
  const paidOffDebts = new Set<string>();

  // Initialize from the month before update, or from original debts if at start
  if (fromMonthIndex > 0) {
    const previousMonth = plan[fromMonthIndex - 1];
    previousMonth.debtPayments.forEach((dp) => {
      // Start with balance from previous month
      currentBalances.set(dp.debtId, dp.balance);
      if (dp.isPaidOff) {
        paidOffDebts.add(dp.debtId);
      }
    });
  } else {
    // Starting from beginning - use original debt amounts
    debts.forEach((debt) => {
      currentBalances.set(debt.id, debt.amount);
    });
  }

  // Set payment amounts - only use updated payments for the specific month being updated
  // For future months, we'll use the original debt monthly payment (snowball will be applied)
  // This ensures edits only affect the month being updated, not future months
  debts.forEach((debt) => {
    // Start with original debt monthly payment
    // Updated payments will be applied only to the month being updated in the loop below
    currentPayments.set(debt.id, debt.monthlyPayment);
  });

  // Sort debts by balance (lowest first) - snowball method
  const sortedDebts = [...debts].sort((a, b) => {
    const balanceA = currentBalances.get(a.id) ?? a.amount;
    const balanceB = currentBalances.get(b.id) ?? b.amount;
    return balanceA - balanceB;
  });

  // Get totals for incomes and recurring expenses
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalRecurringExpenses = recurringExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  // Get the start date from the first month
  const startDate = plan[0]?.paymentMonth
    ? new Date(plan[0].paymentMonth.year, plan[0].paymentMonth.month)
    : new Date();
  const maxMonths = plan.length;

  // Use the provided manuallyEditedPayments to preserve manually edited fields in future months
  // Convert to Map for easier lookup
  const preservedPayments = new Map<number, Map<string, number>>(); // monthIndex -> debtId -> payment
  for (const [monthIndexStr, monthEdits] of Object.entries(manuallyEditedPayments)) {
    const monthIndex = parseInt(monthIndexStr, 10);
    // Only preserve edits in months after the update month
    if (monthIndex > fromMonthIndex && monthIndex < maxMonths) {
      const preservedForMonth = new Map<string, number>();
      for (const [debtId, payment] of Object.entries(monthEdits)) {
        preservedForMonth.set(debtId, payment);
      }
      if (preservedForMonth.size > 0) {
        preservedPayments.set(monthIndex, preservedForMonth);
      }
    }
  }

  // Recalculate from the update month forward
  for (let monthIndex = fromMonthIndex; monthIndex < maxMonths; monthIndex++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(startDate.getMonth() + monthIndex);

    const paymentMonth: PaymentMonth = {
      year: paymentDate.getFullYear(),
      month: paymentDate.getMonth(),
      monthName: getMonthYearString(paymentDate),
    };

    const debtPayments: DebtPayment[] = [];
    const newlyPaidOffDebts: string[] = [];
    let totalPayment = 0;
    let totalInterest = 0;
    let totalPrincipal = 0;

    // Check if this month has preserved payments (manually edited in a previous update)
    const monthPreservedPayments = preservedPayments.get(monthIndex);

    // Calculate total snowball from all paid-off debts
    let totalSnowballFromPaidOffDebts = 0;
    for (const paidOffDebt of sortedDebts) {
      if (paidOffDebts.has(paidOffDebt.id)) {
        totalSnowballFromPaidOffDebts += currentPayments.get(paidOffDebt.id) || 0;
      }
    }

    // Track excess payments from debts paid off this month to add to next debt
    let excessFromThisMonth = 0;
    // Track which debt is currently receiving the snowball (the lowest unpaid debt)
    let currentSnowballRecipient: PaydownDebt | null = null;
    // Track debts paid off during this month's processing (for determining next snowball recipient)
    const paidOffThisMonth = new Set<string>();

    // Calculate payments for each active debt
    for (const debt of sortedDebts) {
      if (paidOffDebts.has(debt.id)) continue;

      const balance = currentBalances.get(debt.id) || 0;

      // Determine base payment:
      // - If this is the update month and this debt was edited, use the edited payment
      // - If this month has preserved payments for this debt, use the preserved payment
      // - Otherwise, use the original debt monthly payment
      let basePayment = currentPayments.get(debt.id) || 0;
      if (monthIndex === fromMonthIndex && updatedPayments.has(debt.id)) {
        basePayment = updatedPayments.get(debt.id)!;
      } else if (monthPreservedPayments?.has(debt.id)) {
        // Use preserved payment from a previous manual edit
        basePayment = monthPreservedPayments.get(debt.id)!;
      }

      // Determine if this debt should receive the snowball
      // The snowball goes to the lowest unpaid debt
      // If the previous recipient was paid off, recalculate who should receive it now
      if (!currentSnowballRecipient || paidOffThisMonth.has(currentSnowballRecipient.id)) {
        // Find the lowest unpaid debt (not in paidOffDebts and not paid off this month)
        currentSnowballRecipient =
          sortedDebts.find((d) => !paidOffDebts.has(d.id) && !paidOffThisMonth.has(d.id)) || null;
      }

      // Determine if this is a preserved (manually edited) payment
      const isPreservedPayment = monthPreservedPayments?.has(debt.id) ?? false;

      // Start with base payment
      let snowballPayment = basePayment;

      // If this is a preserved payment, use it exactly (don't add snowball to it)
      // Otherwise, add snowball to the base payment
      if (!isPreservedPayment) {
        // Only add snowballed payments from paid-off debts to the current snowball recipient
        if (currentSnowballRecipient && debt.id === currentSnowballRecipient.id) {
          snowballPayment += totalSnowballFromPaidOffDebts;
          snowballPayment += additionalSnowball;
          // Also add any excess from debts paid off earlier in this month
          snowballPayment += excessFromThisMonth;
        }
      }

      const result = calculateDebtPayment(balance, debt.interestRate, snowballPayment, debt.type);

      // Use actual payment amount (may be less than snowballPayment if paid off)
      const actualPayment = result.actualPayment;

      debtPayments.push({
        debtId: debt.id,
        debtName: debt.name,
        balance: result.newBalance,
        payment: actualPayment,
        interest: result.interest,
        principal: result.principal,
        isPaidOff: result.isPaidOff,
      });

      // Update balance
      currentBalances.set(debt.id, result.newBalance);

      // Track newly paid off debts
      if (result.isPaidOff) {
        newlyPaidOffDebts.push(debt.id);
        paidOffThisMonth.add(debt.id);
        // Calculate excess payment (snowballPayment - actualPayment) to add to next debt
        const excess = snowballPayment - actualPayment;
        excessFromThisMonth += excess;
        // If this was the snowball recipient, clear it so we recalculate for the next debt
        if (currentSnowballRecipient && debt.id === currentSnowballRecipient.id) {
          currentSnowballRecipient = null;
        }
      }

      totalPayment += actualPayment;
      totalInterest += result.interest;
      totalPrincipal += result.principal;
    }

    // Mark debts as paid off after processing all debts for this month
    newlyPaidOffDebts.forEach((debtId) => {
      paidOffDebts.add(debtId);
    });

    // Re-sort debts by current balance (in case balances changed)
    sortedDebts.sort((a, b) => {
      const balanceA = currentBalances.get(a.id) ?? 0;
      const balanceB = currentBalances.get(b.id) ?? 0;
      return balanceA - balanceB;
    });

    // Calculate remaining balance
    const remainingBalance = totalIncome - totalPayment - totalRecurringExpenses;

    updatedPlan.push({
      paymentMonth,
      debtPayments,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPrincipal: Math.round(totalPrincipal * 100) / 100,
      incomes,
      totalIncome: Math.round(totalIncome * 100) / 100,
      recurringExpenses,
      totalRecurringExpenses: Math.round(totalRecurringExpenses * 100) / 100,
      remainingBalance: Math.round(remainingBalance * 100) / 100,
    });
  }

  return updatedPlan;
}

/**
 * Generate snowball payment plan for all debts
 * Debts are sorted by balance (lowest first) and payments snowball as debts are paid off
 * @param debts - Array of debts to include in the plan
 * @param startDate - Date to start the payment plan (defaults to today)
 * @param yearsToPlan - Maximum number of years to plan (defaults to 50)
 * @param additionalSnowball - Additional amount to apply monthly on top of regular payments (defaults to 0)
 * @param incomes - Array of monthly incomes
 * @param recurringExpenses - Array of recurring monthly expenses
 */
export function generateSnowballPlan(
  debts: PaydownDebt[],
  startDate?: Date,
  yearsToPlan: number = 50,
  additionalSnowball: number = 0,
  incomes: MonthlyIncome[] = [],
  recurringExpenses: RecurringExpense[] = [],
): MonthlyPaymentPlan[] {
  if (debts.length === 0) return [];

  // Sort debts by balance (lowest first) - snowball method
  const sortedDebts = [...debts].sort((a, b) => a.amount - b.amount);

  const plan: MonthlyPaymentPlan[] = [];
  const currentBalances = new Map<string, number>();
  const currentPayments = new Map<string, number>();
  const paidOffDebts = new Set<string>();

  // Initialize balances and payments
  sortedDebts.forEach((debt) => {
    currentBalances.set(debt.id, debt.amount);
    currentPayments.set(debt.id, debt.monthlyPayment);
  });

  // Use provided start date or default to today
  const planStartDate = startDate ? new Date(startDate) : new Date();
  let currentMonth = 0;
  const maxMonths = yearsToPlan * 12; // Convert years to months

  while (paidOffDebts.size < sortedDebts.length && currentMonth < maxMonths) {
    const paymentDate = new Date(planStartDate);
    paymentDate.setMonth(planStartDate.getMonth() + currentMonth);

    const paymentMonth: PaymentMonth = {
      year: paymentDate.getFullYear(),
      month: paymentDate.getMonth(),
      monthName: getMonthYearString(paymentDate),
    };

    const debtPayments: DebtPayment[] = [];
    const newlyPaidOffDebts: string[] = [];
    let totalPayment = 0;
    let totalInterest = 0;
    let totalPrincipal = 0;

    // Calculate totals for incomes and recurring expenses
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalRecurringExpenses = recurringExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );

    // Find all paid-off debts and calculate total snowball payment
    let totalSnowballFromPaidOffDebts = 0;
    for (const paidOffDebt of sortedDebts) {
      if (paidOffDebts.has(paidOffDebt.id)) {
        totalSnowballFromPaidOffDebts += currentPayments.get(paidOffDebt.id) || 0;
      }
    }

    // Track excess payments from debts paid off this month to add to next debt
    let excessFromThisMonth = 0;
    // Track which debt is currently receiving the snowball (the lowest unpaid debt)
    let currentSnowballRecipient: PaydownDebt | null = null;
    // Track debts paid off during this month's processing (for determining next snowball recipient)
    const paidOffThisMonth = new Set<string>();

    // Calculate payments for each active debt
    for (const debt of sortedDebts) {
      if (paidOffDebts.has(debt.id)) continue;

      const balance = currentBalances.get(debt.id) || 0;
      const basePayment = currentPayments.get(debt.id) || 0;

      // Determine if this debt should receive the snowball
      // The snowball goes to the lowest unpaid debt
      // If the previous recipient was paid off, recalculate who should receive it now
      if (!currentSnowballRecipient || paidOffThisMonth.has(currentSnowballRecipient.id)) {
        // Find the lowest unpaid debt (not in paidOffDebts and not paid off this month)
        currentSnowballRecipient =
          sortedDebts.find((d) => !paidOffDebts.has(d.id) && !paidOffThisMonth.has(d.id)) || null;
      }

      // Start with base payment
      let snowballPayment = basePayment;

      // Only add snowballed payments from paid-off debts to the current snowball recipient
      if (currentSnowballRecipient && debt.id === currentSnowballRecipient.id) {
        snowballPayment += totalSnowballFromPaidOffDebts;
        snowballPayment += additionalSnowball;
        // Also add any excess from debts paid off earlier in this month
        snowballPayment += excessFromThisMonth;
      }

      const result = calculateDebtPayment(balance, debt.interestRate, snowballPayment, debt.type);

      // Use actual payment amount (may be less than snowballPayment if paid off)
      const actualPayment = result.actualPayment;

      debtPayments.push({
        debtId: debt.id,
        debtName: debt.name,
        balance: result.newBalance,
        payment: actualPayment,
        interest: result.interest,
        principal: result.principal,
        isPaidOff: result.isPaidOff,
      });

      // Update balance
      currentBalances.set(debt.id, result.newBalance);

      // Track newly paid off debts (mark them after processing all debts)
      if (result.isPaidOff) {
        newlyPaidOffDebts.push(debt.id);
        paidOffThisMonth.add(debt.id);
        // Calculate excess payment (snowballPayment - actualPayment) to add to next debt
        const excess = snowballPayment - actualPayment;
        excessFromThisMonth += excess;
        // If this was the snowball recipient, clear it so we recalculate for the next debt
        if (currentSnowballRecipient && debt.id === currentSnowballRecipient.id) {
          currentSnowballRecipient = null;
        }
      }

      totalPayment += actualPayment;
      totalInterest += result.interest;
      totalPrincipal += result.principal;
    }

    // Mark debts as paid off after processing all debts for this month
    newlyPaidOffDebts.forEach((debtId) => {
      paidOffDebts.add(debtId);
    });

    // Re-sort debts by current balance (in case balances changed and order matters)
    sortedDebts.sort((a, b) => {
      const balanceA = currentBalances.get(a.id) ?? 0;
      const balanceB = currentBalances.get(b.id) ?? 0;
      return balanceA - balanceB;
    });

    // Calculate remaining balance: income - debt payments - recurring expenses
    const remainingBalance = totalIncome - totalPayment - totalRecurringExpenses;

    plan.push({
      paymentMonth,
      debtPayments,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPrincipal: Math.round(totalPrincipal * 100) / 100,
      incomes,
      totalIncome: Math.round(totalIncome * 100) / 100,
      recurringExpenses,
      totalRecurringExpenses: Math.round(totalRecurringExpenses * 100) / 100,
      remainingBalance: Math.round(remainingBalance * 100) / 100,
    });

    currentMonth++;

    // If all debts are paid off, we're done
    if (paidOffDebts.size === sortedDebts.length) {
      break;
    }
  }

  return plan;
}
