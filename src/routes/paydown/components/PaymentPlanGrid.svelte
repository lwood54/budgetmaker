<script lang="ts">
  import { Button, P } from 'flowbite-svelte';
  import type { MonthlyPaymentPlan, DebtPayment } from '../helpers/paydownPlan';
  import type { PaydownDebt } from '../helpers/localStorage';
  import { sortDebtsByPriority } from '../helpers/debtSorting';

  type Props = {
    paymentPlan: MonthlyPaymentPlan[];
    debts: PaydownDebt[];
    hasEdits: (monthIndex: number) => boolean;
    handleUpdateMonth: (monthIndex: number) => void;
    getDisplayPayment: (monthIndex: number, debtId: string, defaultPayment: number) => number;
    handlePaymentChange: (monthIndex: number, debtId: string, value: string) => void;
  };

  let {
    paymentPlan,
    debts,
    hasEdits,
    handleUpdateMonth,
    getDisplayPayment,
    handlePaymentChange,
  }: Props = $props();

  // Get all unique debts from the plan, sorted by priority (highest first)
  const allDebts = $derived(() => {
    const debtMap = new Map<string, PaydownDebt>();
    debts.forEach((debt) => {
      debtMap.set(debt.id, debt);
    });
    const uniqueDebts = Array.from(debtMap.values());
    return sortDebtsByPriority(uniqueDebts);
  });

  // Group months by year and ensure 12 months per year starting from January
  const yearsData = $derived(() => {
    if (paymentPlan.length === 0) return [];

    const years: Array<{
      year: number;
      months: (MonthlyPaymentPlan | null)[];
      startIndex: number; // Index in paymentPlan array
    }> = [];

    // Get the first month's date to determine starting year
    const firstMonth = paymentPlan[0];
    const firstDate = new Date(firstMonth.paymentMonth.year, 0, 1); // January 1st of first year

    let currentYear = firstDate.getFullYear();
    let planIndex = 0;

    while (planIndex < paymentPlan.length) {
      const yearMonths: (MonthlyPaymentPlan | null)[] = [];
      const yearStartIndex = planIndex;

      // Fill 12 months for this year (Jan-Dec)
      for (let monthNum = 0; monthNum < 12; monthNum++) {
        const expectedDate = new Date(currentYear, monthNum, 1);
        const expectedMonthName = expectedDate.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        });

        // Check if we have this month in the plan
        if (
          planIndex < paymentPlan.length &&
          paymentPlan[planIndex].paymentMonth.monthName === expectedMonthName
        ) {
          yearMonths.push(paymentPlan[planIndex]);
          planIndex++;
        } else {
          yearMonths.push(null); // Empty month placeholder
        }
      }

      years.push({
        year: currentYear,
        months: yearMonths,
        startIndex: yearStartIndex,
      });

      currentYear++;
    }

    return years;
  });

  // Get debt payment for a specific month and debt
  function getDebtPaymentForMonth(
    monthPlan: MonthlyPaymentPlan | null,
    debtId: string,
  ): DebtPayment | null {
    if (!monthPlan) return null;
    return monthPlan.debtPayments.find((dp) => dp.debtId === debtId) || null;
  }

  // Get debt priority
  function getDebtPriority(debtId: string): number {
    const debt = debts.find((d) => d.id === debtId);
    return debt?.priority || 0;
  }

  // Get base monthly payment for a debt
  function getBaseMonthlyPayment(debtId: string): number {
    const debt = debts.find((d) => d.id === debtId);
    return debt?.monthlyPayment || 0;
  }

  // Check if a debt is receiving snowball in a given month
  function isSnowballRecipient(monthPlan: MonthlyPaymentPlan | null, debtId: string): boolean {
    if (!monthPlan) return false;
    const debtPayment = getDebtPaymentForMonth(monthPlan, debtId);
    if (!debtPayment || debtPayment.isPaidOff) return false;

    const priority = getDebtPriority(debtId);
    if (priority === 0) return false; // Priority 0 debts don't receive snowball

    const basePayment = getBaseMonthlyPayment(debtId);
    // If payment is significantly higher than base, it's receiving snowball
    return debtPayment.payment > basePayment + 0.01;
  }

  // Track collapsed state for debt payments and recurring expenses
  // Empty set means all years are expanded by default
  let collapsedDebts = $state<Set<number>>(new Set());
  let expandedRecurring = $state<Set<number>>(new Set());

  // Track which cell is currently being edited: "monthIndex-debtId"
  let editingCell = $state<string | null>(null);

  function toggleDebts(yearIndex: number) {
    if (collapsedDebts.has(yearIndex)) {
      collapsedDebts.delete(yearIndex);
    } else {
      collapsedDebts.add(yearIndex);
    }
    collapsedDebts = new Set(collapsedDebts);
  }

  function toggleRecurring(yearIndex: number) {
    if (expandedRecurring.has(yearIndex)) {
      expandedRecurring.delete(yearIndex);
    } else {
      expandedRecurring.add(yearIndex);
    }
    expandedRecurring = new Set(expandedRecurring);
  }

  // Get month index in the full paymentPlan array
  function getMonthIndex(yearIndex: number, monthInYear: number): number {
    return yearsData()[yearIndex].startIndex + monthInYear;
  }

  // Action to focus input when it mounts
  function focusOnMount(node: HTMLInputElement) {
    node.focus();
    node.select();
    return {
      update() {},
      destroy() {},
    };
  }
</script>

{#if paymentPlan.length > 0}
  <div class="flex w-full flex-col gap-6">
    {#each yearsData() as yearData, yearIndex}
      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {yearData.year}
        </h3>

        <div class="overflow-x-auto">
          <div class="inline-block min-w-full">
            <!-- Grid container: 1 label column + N month columns -->
            <div
              class="grid border border-neutral-300 dark:border-neutral-700"
              style="grid-template-columns: 200px repeat({yearData.months
                .length}, minmax(120px, 1fr));"
            >
              <!-- Header row -->
              <div
                class="sticky left-0 z-20 border-r border-neutral-300 bg-neutral-100 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <P size="sm" class="font-semibold">Debt</P>
              </div>
              {#each yearData.months as monthPlan, monthInYear}
                <div
                  class="border-r border-neutral-300 bg-neutral-100 px-3 py-2 text-center last:border-r-0 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  {#if monthPlan}
                    <div class="flex flex-col gap-1">
                      <P size="xs" class="font-semibold">{monthPlan.paymentMonth.monthName}</P>
                      <Button
                        size="xs"
                        color="primary"
                        disabled={!hasEdits(getMonthIndex(yearIndex, monthInYear))}
                        onclick={() => handleUpdateMonth(getMonthIndex(yearIndex, monthInYear))}
                      >
                        Update
                      </Button>
                    </div>
                  {:else}
                    <P size="xs" class="text-neutral-400">-</P>
                  {/if}
                </div>
              {/each}

              <!-- Income row -->
              <div
                class="sticky left-0 z-10 border-t border-r border-neutral-300 bg-green-50 px-4 py-2 font-semibold dark:border-neutral-700 dark:bg-green-900/20"
              >
                <P size="sm" class="font-semibold text-green-700 dark:text-green-400">Income</P>
              </div>
              {#each yearData.months as monthPlan}
                <div
                  class="border-t border-r border-neutral-300 bg-green-50 px-2 py-2 text-center last:border-r-0 dark:border-neutral-700 dark:bg-green-900/20"
                >
                  {#if monthPlan}
                    <P size="sm" class="font-semibold text-green-600 dark:text-green-300">
                      +${monthPlan.totalIncome.toLocaleString()}
                    </P>
                  {:else}
                    <P size="xs" class="text-neutral-300 dark:text-neutral-600">-</P>
                  {/if}
                </div>
              {/each}

              <!-- Recurring Expenses row (collapsible) -->
              <div
                class="sticky left-0 z-10 border-t border-r border-neutral-300 bg-orange-50 px-4 py-2 font-semibold dark:border-neutral-700 dark:bg-orange-900/20"
              >
                <button
                  onclick={() => toggleRecurring(yearIndex)}
                  class="flex items-center gap-2 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <P size="sm" class="font-semibold text-orange-700 dark:text-orange-400"
                    >Recurring</P
                  >
                  <span class="text-xs">{expandedRecurring.has(yearIndex) ? '▼' : '▶'}</span>
                </button>
              </div>
              {#each yearData.months as monthPlan}
                <div
                  class="border-t border-r border-neutral-300 bg-orange-50 px-2 py-2 text-center last:border-r-0 dark:border-neutral-700 dark:bg-orange-900/20"
                >
                  {#if monthPlan}
                    <P size="sm" class="font-semibold text-orange-600 dark:text-orange-300">
                      -${monthPlan.totalRecurringExpenses.toLocaleString()}
                    </P>
                  {:else}
                    <P size="xs" class="text-neutral-300 dark:text-neutral-600">-</P>
                  {/if}
                </div>
              {/each}

              <!-- Expanded recurring expenses rows -->
              {#if expandedRecurring.has(yearIndex)}
                {#each yearData.months[0]?.recurringExpenses || [] as expense}
                  <div
                    class="sticky left-0 z-10 border-t border-r border-neutral-300 bg-orange-50/50 px-4 py-1 pl-8 text-xs dark:border-neutral-700 dark:bg-orange-900/10"
                  >
                    <P size="xs" class="text-orange-700 dark:text-orange-400">{expense.title}</P>
                  </div>
                  {#each yearData.months as monthPlan}
                    <div
                      class="border-t border-r border-neutral-300 bg-orange-50/50 px-2 py-1 text-center text-xs last:border-r-0 dark:border-neutral-700 dark:bg-orange-900/10"
                    >
                      {#if monthPlan}
                        {@const expenseItem = monthPlan.recurringExpenses.find(
                          (e) => e.id === expense.id,
                        )}
                        {#if expenseItem}
                          <P size="xs" class="text-orange-600 dark:text-orange-300">
                            -${expenseItem.amount.toLocaleString()}
                          </P>
                        {:else}
                          <P size="xs" class="text-neutral-400">-</P>
                        {/if}
                      {:else}
                        <P size="xs" class="text-neutral-300 dark:text-neutral-600">-</P>
                      {/if}
                    </div>
                  {/each}
                {/each}
              {/if}

              <!-- Totals row (collapsible) -->
              <div
                class="sticky left-0 z-10 border-t-2 border-r border-neutral-400 bg-neutral-50 px-4 py-2 font-semibold dark:border-neutral-700 dark:bg-neutral-800/50"
              >
                <button
                  onclick={() => toggleDebts(yearIndex)}
                  class="hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-2"
                >
                  <P size="sm" class="font-semibold">Total Payments</P>
                  <span class="text-xs">{!collapsedDebts.has(yearIndex) ? '▼' : '▶'}</span>
                </button>
              </div>
              {#each yearData.months as monthPlan}
                <div
                  class="border-t-2 border-r border-neutral-400 bg-neutral-50 px-2 py-2 text-center last:border-r-0 dark:border-neutral-700 dark:bg-neutral-800/50"
                >
                  {#if monthPlan}
                    <P size="sm" class="font-semibold text-red-600 dark:text-red-400">
                      ${monthPlan.totalPayment.toLocaleString()}
                    </P>
                  {:else}
                    <P size="xs" class="text-neutral-300 dark:text-neutral-600">-</P>
                  {/if}
                </div>
              {/each}

              <!-- Expanded debt payment rows -->
              {#if !collapsedDebts.has(yearIndex)}
                {#each allDebts() as debt}
                  {@const priority = getDebtPriority(debt.id)}
                  <div
                    class="sticky left-0 z-10 border-t border-r border-neutral-300 bg-white px-4 py-2 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-900/50"
                  >
                    <div class="flex flex-col gap-1">
                      <P size="sm" class="font-semibold">{debt.name}</P>
                      <div
                        class="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400"
                      >
                        {#if priority > 0}
                          <span
                            class="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded px-1.5 py-0.5"
                          >
                            P{priority}
                          </span>
                        {/if}
                        <span>Rate: {debt.interestRate}%</span>
                      </div>
                    </div>
                  </div>
                  {#each yearData.months as monthPlan, monthInYear}
                    {@const debtPayment = getDebtPaymentForMonth(monthPlan, debt.id)}
                    {@const isSnowball = isSnowballRecipient(monthPlan, debt.id)}
                    {@const monthIndex = getMonthIndex(yearIndex, monthInYear)}
                    <div
                      class="border-t border-r border-neutral-300 p-0 text-center last:border-r-0 dark:border-neutral-700 {isSnowball
                        ? 'dark:bg-aqua-200/30 bg-teal-800'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50'}"
                    >
                      {#if monthPlan && debtPayment}
                        {#if debtPayment.isPaidOff}
                          <div class="flex flex-col items-center gap-1 px-2 py-2">
                            <P size="xs" class="font-semibold text-green-600 dark:text-green-400"
                              >Paid</P
                            >
                            <P size="xs" class="text-green-600 dark:text-green-400">
                              ${Math.round(debtPayment.payment).toLocaleString()}
                            </P>
                          </div>
                        {:else}
                          {@const cellKey = `${monthIndex}-${debt.id}`}
                          {@const isEditing = editingCell === cellKey}
                          {@const displayValue = getDisplayPayment(
                            monthIndex,
                            debt.id,
                            debtPayment.payment,
                          )}
                          <div class="flex flex-col items-end gap-1 px-2 py-2">
                            {#if isEditing}
                              <input
                                type="number"
                                value={displayValue}
                                oninput={(e) =>
                                  handlePaymentChange(monthIndex, debt.id, e.currentTarget.value)}
                                onblur={() => (editingCell = null)}
                                onkeydown={(e) => {
                                  if (e.key === 'Enter' || e.key === 'Escape') {
                                    editingCell = null;
                                  }
                                }}
                                step="0.01"
                                min="0"
                                class="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-right text-xs text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                                use:focusOnMount
                              />
                            {:else}
                              <button
                                type="button"
                                onclick={() => (editingCell = cellKey)}
                                class="w-full cursor-pointer text-right text-sm text-neutral-900 transition-colors dark:text-neutral-100"
                              >
                                ${Math.round(displayValue).toLocaleString()}
                              </button>
                            {/if}
                            <P size="xs" class="text-right text-neutral-500 dark:text-neutral-400">
                              ${Math.round(debtPayment.balance).toLocaleString()}
                            </P>
                          </div>
                        {/if}
                      {:else if monthPlan}
                        <P size="xs" class="text-neutral-400">-</P>
                      {:else}
                        <P size="xs" class="text-neutral-300 dark:text-neutral-600">-</P>
                      {/if}
                    </div>
                  {/each}
                {/each}
              {/if}

              <!-- Remaining Balance row -->
              <div
                class="sticky left-0 z-10 border-t-2 border-r border-neutral-400 bg-neutral-100 px-4 py-2 font-semibold dark:border-neutral-700 dark:bg-neutral-800"
              >
                <P size="sm" class="font-semibold">Remaining</P>
              </div>
              {#each yearData.months as monthPlan}
                <div
                  class="border-t-2 border-r border-neutral-400 bg-neutral-100 px-2 py-2 text-center last:border-r-0 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  {#if monthPlan}
                    <P
                      size="sm"
                      class="font-bold {monthPlan.remainingBalance >= 0
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'}"
                    >
                      {monthPlan.remainingBalance >= 0
                        ? '+'
                        : ''}${monthPlan.remainingBalance.toLocaleString()}
                    </P>
                  {:else}
                    <P size="xs" class="text-neutral-300 dark:text-neutral-600">-</P>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div
    class="flex flex-col items-center justify-center rounded-lg border-2 border-neutral-300 p-8 dark:border-neutral-700"
  >
    <P size="base" class="text-neutral-600 dark:text-neutral-400"
      >Click "Generate Plan" to create your snowball payment plan.</P
    >
  </div>
{/if}
