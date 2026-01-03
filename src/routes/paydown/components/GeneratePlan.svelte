<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, P, Datepicker, Input, Hr } from 'flowbite-svelte';
  import {
    getAllDebts,
    getAllIncomes,
    getAllRecurringExpenses,
    type PaydownDebt,
    type MonthlyIncome,
    type RecurringExpense,
  } from '../helpers/localStorage';
  import {
    generateSnowballPlan,
    recalculatePlanFromMonth,
    type MonthlyPaymentPlan,
  } from '../helpers/paydownPlan';
  import PaymentPlanGrid from './PaymentPlanGrid.svelte';

  // Plan generation fields
  let planStartDate = $state<Date>(new Date());
  let yearsToPlan = $state(5);
  let additionalSnowball = $state('');

  // Data from localStorage
  let debts = $state<PaydownDebt[]>([]);
  let incomes = $state<MonthlyIncome[]>([]);
  let recurringExpenses = $state<RecurringExpense[]>([]);

  // Payment plan state
  let paymentPlan = $state<MonthlyPaymentPlan[]>([]);
  let editedPayments = $state<Record<number, Record<string, number>>>({});
  let originalPayments = $state<Record<number, Record<string, number>>>({});
  let manuallyEditedPayments = $state<Record<number, Record<string, number>>>({});

  function loadDebts() {
    debts = getAllDebts();
  }

  function loadIncomes() {
    incomes = getAllIncomes();
  }

  function loadRecurringExpenses() {
    recurringExpenses = getAllRecurringExpenses();
  }

  function handleGeneratePlan() {
    if (debts.length === 0) return;

    const startDate = planStartDate ? new Date(planStartDate) : new Date();
    const additionalSnowballAmount = parseFloat(additionalSnowball) || 0;

    // Generate plan
    const newPlan = generateSnowballPlan(
      debts,
      startDate,
      yearsToPlan,
      additionalSnowballAmount,
      incomes,
      recurringExpenses,
    );

    // Clear edited payments when generating new plan BEFORE updating paymentPlan
    editedPayments = {};
    originalPayments = {};
    manuallyEditedPayments = {};

    // Update paymentPlan last, after clearing all related state
    paymentPlan = newPlan;
  }

  function handlePaymentChange(monthIndex: number, debtId: string, value: string) {
    // Treat empty string as 0
    const paymentValue = value === '' ? 0 : parseFloat(value) || 0;

    // Store original value if not already stored
    if (!originalPayments[monthIndex]) {
      originalPayments[monthIndex] = {};
      // Store all original payments for this month
      const monthPlan = paymentPlan[monthIndex];
      if (monthPlan) {
        monthPlan.debtPayments.forEach((dp) => {
          originalPayments[monthIndex][dp.debtId] = dp.payment;
        });
      }
      // Trigger reactivity
      originalPayments = { ...originalPayments };
    }

    // Initialize month edits if needed and create new object to trigger reactivity
    if (!editedPayments[monthIndex]) {
      editedPayments[monthIndex] = {};
    }

    // Store the edited value in a new object to ensure reactivity
    editedPayments = {
      ...editedPayments,
      [monthIndex]: {
        ...editedPayments[monthIndex],
        [debtId]: paymentValue,
      },
    };
  }

  function handleUpdateMonth(monthIndex: number) {
    if (!editedPayments[monthIndex]) return;

    const monthEdits = editedPayments[monthIndex];
    if (Object.keys(monthEdits).length === 0) return;

    // Save these edits to the persistent manually edited payments tracker
    if (!manuallyEditedPayments[monthIndex]) {
      manuallyEditedPayments[monthIndex] = {};
    }
    Object.entries(monthEdits).forEach(([debtId, payment]) => {
      manuallyEditedPayments[monthIndex][debtId] = payment;
    });
    manuallyEditedPayments = { ...manuallyEditedPayments };

    // Merge current edits with any previously saved edits for this month
    // This ensures we preserve all edits for the month, not just the new ones
    const allMonthEdits = {
      ...(manuallyEditedPayments[monthIndex] || {}),
      ...monthEdits, // Current edits override previous ones if there's a conflict
    };

    // Convert to Map<string, number> for the function
    const updatedPayments = new Map<string, number>();
    Object.entries(allMonthEdits).forEach(([debtId, payment]) => {
      updatedPayments.set(debtId, payment);
    });

    const additionalSnowballAmount = parseFloat(additionalSnowball) || 0;

    // Recalculate from this month forward, preserving manually edited payments in future months
    paymentPlan = recalculatePlanFromMonth(
      paymentPlan,
      monthIndex,
      updatedPayments,
      debts,
      incomes,
      recurringExpenses,
      additionalSnowballAmount,
      manuallyEditedPayments,
    );

    // Clear temporary edits for this month after update (but keep manuallyEditedPayments)
    delete editedPayments[monthIndex];
    delete originalPayments[monthIndex];
    // Trigger reactivity
    editedPayments = { ...editedPayments };
    originalPayments = { ...originalPayments };
  }

  function getEditedPayment(monthIndex: number, debtId: string): number | undefined {
    return editedPayments[monthIndex]?.[debtId];
  }

  function getDisplayPayment(monthIndex: number, debtId: string, currentPayment: number): number {
    // If there's an edited value, use that
    const edited = getEditedPayment(monthIndex, debtId);
    if (edited !== undefined) {
      return edited;
    }
    // If we've started editing this month, use the stored original value
    // This ensures fields are independent until Update is clicked
    if (originalPayments[monthIndex]?.[debtId] !== undefined) {
      return originalPayments[monthIndex][debtId];
    }
    // Otherwise, use the current payment from the plan (for months not yet edited)
    return currentPayment;
  }

  function hasEdits(monthIndex: number): boolean {
    if (!editedPayments[monthIndex]) return false;

    const monthEdits = editedPayments[monthIndex];
    const originals = originalPayments[monthIndex];

    if (!originals) return false;

    // Check if any edited value differs from the original payment
    for (const [debtId, editedValue] of Object.entries(monthEdits)) {
      const originalValue = originals[debtId];
      if (originalValue !== undefined && Math.abs(editedValue - originalValue) > 0.01) {
        return true;
      }
    }

    return false;
  }

  onMount(() => {
    loadDebts();
    loadIncomes();
    loadRecurringExpenses();
  });
</script>

<div class="flex w-full flex-col gap-4">
  <div class="flex w-full flex-col gap-4 p-4">
    <div class="flex w-76 flex-col justify-start gap-4 lg:w-full lg:flex-row">
      <div class="flex items-center gap-2">
        <P size="sm" class="w-24">Start Date:</P>
        <Datepicker class="z-1000" color="primary" bind:value={planStartDate} autohide />
      </div>
      <div class="flex items-center gap-2">
        <P size="sm" class="w-42">Years to Plan:</P>
        <Input type="number" bind:value={yearsToPlan} min="1" max="50" />
      </div>
      <div class="flex items-center gap-2">
        <P size="sm" class="w-52">Additional Snowball:</P>
        <Input
          type="number"
          bind:value={additionalSnowball}
          step="0.01"
          min="0"
          placeholder="0.00"
        />
      </div>
      <Button onclick={handleGeneratePlan}>Generate Plan</Button>
    </div>
  </div>
  <Hr class="my-4" />
  <PaymentPlanGrid
    {paymentPlan}
    {debts}
    {hasEdits}
    {handleUpdateMonth}
    {getDisplayPayment}
    {handlePaymentChange}
  />
</div>
