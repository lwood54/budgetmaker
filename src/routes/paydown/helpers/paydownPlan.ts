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
  payment: number;
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

  return {
    interest: Math.round(interest * 100) / 100,
    principal: Math.round(principal * 100) / 100,
    newBalance: Math.round(newBalance * 100) / 100,
    isPaidOff,
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
 */
export function recalculatePlanFromMonth(
  plan: MonthlyPaymentPlan[],
  fromMonthIndex: number,
  updatedPayments: Map<string, number>, // debtId -> new payment amount
  debts: PaydownDebt[],
  incomes: MonthlyIncome[],
  recurringExpenses: RecurringExpense[],
  additionalSnowball: number,
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

  // Set payment amounts - use updated payments if provided, otherwise use original debt payments
  debts.forEach((debt) => {
    currentPayments.set(debt.id, updatedPayments.get(debt.id) ?? debt.monthlyPayment);
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

    // Find the first unpaid debt (lowest balance that hasn't been paid off)
    const firstUnpaidDebt = sortedDebts.find((debt) => !paidOffDebts.has(debt.id));

    // Calculate total snowball from all paid-off debts
    let totalSnowballFromPaidOffDebts = 0;
    for (const paidOffDebt of sortedDebts) {
      if (paidOffDebts.has(paidOffDebt.id)) {
        totalSnowballFromPaidOffDebts += currentPayments.get(paidOffDebt.id) || 0;
      }
    }

    // Calculate payments for each active debt
    for (const debt of sortedDebts) {
      if (paidOffDebts.has(debt.id)) continue;

      const balance = currentBalances.get(debt.id) || 0;
      const basePayment = currentPayments.get(debt.id) || 0;

      // Start with base payment
      let snowballPayment = basePayment;

      // Only add snowballed payments from paid-off debts to the FIRST unpaid debt (next lowest)
      if (firstUnpaidDebt && debt.id === firstUnpaidDebt.id) {
        snowballPayment += totalSnowballFromPaidOffDebts;
        snowballPayment += additionalSnowball;
      }

      const result = calculateDebtPayment(balance, debt.interestRate, snowballPayment, debt.type);

      debtPayments.push({
        debtId: debt.id,
        debtName: debt.name,
        balance: result.newBalance,
        payment: snowballPayment,
        interest: result.interest,
        principal: result.principal,
        isPaidOff: result.isPaidOff,
      });

      // Update balance
      currentBalances.set(debt.id, result.newBalance);

      // Track newly paid off debts
      if (result.isPaidOff) {
        newlyPaidOffDebts.push(debt.id);
      }

      totalPayment += snowballPayment;
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

    // Find the first unpaid debt (lowest balance that hasn't been paid off)
    const firstUnpaidDebt = sortedDebts.find((debt) => !paidOffDebts.has(debt.id));

    // Find all paid-off debts and calculate total snowball payment
    // This should only go to the NEXT lowest unpaid debt (the first unpaid debt)
    let totalSnowballFromPaidOffDebts = 0;
    for (const paidOffDebt of sortedDebts) {
      if (paidOffDebts.has(paidOffDebt.id)) {
        totalSnowballFromPaidOffDebts += currentPayments.get(paidOffDebt.id) || 0;
      }
    }

    // Calculate payments for each active debt
    for (const debt of sortedDebts) {
      if (paidOffDebts.has(debt.id)) continue;

      const balance = currentBalances.get(debt.id) || 0;
      const basePayment = currentPayments.get(debt.id) || 0;

      // Start with base payment
      let snowballPayment = basePayment;

      // Only add snowballed payments from paid-off debts to the FIRST unpaid debt (next lowest)
      // When that debt is paid off, the snowball moves to the next one
      if (firstUnpaidDebt && debt.id === firstUnpaidDebt.id) {
        snowballPayment += totalSnowballFromPaidOffDebts;
        snowballPayment += additionalSnowball;
      }

      const result = calculateDebtPayment(balance, debt.interestRate, snowballPayment, debt.type);

      debtPayments.push({
        debtId: debt.id,
        debtName: debt.name,
        balance: result.newBalance,
        payment: snowballPayment,
        interest: result.interest,
        principal: result.principal,
        isPaidOff: result.isPaidOff,
      });

      // Update balance
      currentBalances.set(debt.id, result.newBalance);

      // Track newly paid off debts (mark them after processing all debts)
      if (result.isPaidOff) {
        newlyPaidOffDebts.push(debt.id);
      }

      totalPayment += snowballPayment;
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
