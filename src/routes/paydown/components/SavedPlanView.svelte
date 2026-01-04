<script lang="ts">
  import { onDestroy } from 'svelte';
  import { P } from 'flowbite-svelte';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';
  import { getSavedPlan } from '$lib/api/paydown.remote';
  import type { MonthlyPaymentPlan } from '../helpers/paydownPlan';
  import type { PaydownDebt } from '../helpers/localStorage';
  import { sortDebtsByPriority } from '../helpers/debtSorting';

  type Props = {
    planId: string;
    onDeletePlan?: () => void;
  };

  let { planId, onDeletePlan }: Props = $props();

  // Load the saved plan
  const planResult = $derived(await getSavedPlan(planId));
  const plan = $derived(planResult ?? null);

  // Group months by year and ensure 12 months per year starting from January
  const yearsData = $derived(() => {
    if (!plan || plan.paymentPlan.length === 0) return [];

    const years: Array<{
      year: number;
      months: (MonthlyPaymentPlan | null)[];
      startIndex: number;
    }> = [];

    // Get the first month's date to determine starting year
    const firstMonth = plan.paymentPlan[0];
    const firstDate = new Date(firstMonth.paymentMonth.year, 0, 1); // January 1st of first year

    let currentYear = firstDate.getFullYear();
    let planIndex = 0;

    while (planIndex < plan.paymentPlan.length) {
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
          planIndex < plan.paymentPlan.length &&
          plan.paymentPlan[planIndex].paymentMonth.monthName === expectedMonthName
        ) {
          yearMonths.push(plan.paymentPlan[planIndex]);
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

  // Lazy loading with IntersectionObserver
  let loadedYears = $state<Set<number>>(new Set([0])); // Load first year immediately
  let observer: IntersectionObserver | null = null;
  let yearRefs = $state<Map<number, HTMLDivElement>>(new Map());

  // Track total years count for last year detection
  const totalYearsCount = $derived(yearsData().length);

  // Action to set up intersection observer for a year element
  function setupYearObserver(node: HTMLDivElement) {
    if (!node) return;

    const yearIndexAttr = node.getAttribute('data-year-index');
    if (yearIndexAttr === null) return;

    const yearIndex = parseInt(yearIndexAttr, 10);

    // Store ref
    yearRefs.set(yearIndex, node);

    // Create observer if it doesn't exist
    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const indexAttr = entry.target.getAttribute('data-year-index');
              if (indexAttr !== null) {
                const index = parseInt(indexAttr, 10);
                if (!loadedYears.has(index)) {
                  loadedYears = new Set([...loadedYears, index]); // Trigger reactivity
                }
              }
            }
          });
        },
        {
          rootMargin: '200px', // Start loading 200px before it comes into view
        },
      );
    }

    // Observe this year element
    observer.observe(node);

    return {
      update(newNode: HTMLDivElement) {
        if (node !== newNode) {
          if (observer) {
            observer.unobserve(node);
          }
          node = newNode;
          const newYearIndexAttr = node.getAttribute('data-year-index');
          if (newYearIndexAttr !== null) {
            const newYearIndex = parseInt(newYearIndexAttr, 10);
            yearRefs.set(newYearIndex, node);
            if (observer) {
              observer.observe(node);
            }
          }
        }
      },
      destroy() {
        if (observer) {
          observer.unobserve(node);
        }
      },
    };
  }

  // Effect to ensure last year loads even if it doesn't intersect
  $effect(() => {
    if (!plan) return;
    const totalYears = totalYearsCount;
    if (totalYears > 1) {
      const lastYearIndex = totalYears - 1;
      // Check after a delay to see if last year loaded via intersection observer
      setTimeout(() => {
        if (!loadedYears.has(lastYearIndex)) {
          // Last year didn't load via intersection, load it manually
          loadedYears = new Set([...loadedYears, lastYearIndex]);
        }
      }, 500);
    }
  });

  function cleanupObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // Cleanup on component destroy
  onDestroy(() => {
    cleanupObserver();
  });

  function getDebtPaymentForMonth(monthPlan: MonthlyPaymentPlan | null, debtId: string) {
    if (!monthPlan) return null;
    return monthPlan.debtPayments.find((dp) => dp.debtId === debtId);
  }

  // Get debt priority
  function getDebtPriority(debtId: string): number {
    if (!plan) return 0;
    const debt = plan.debts.find((d) => d.id === debtId);
    return debt?.priority || 0;
  }

  // Get base monthly payment for a debt
  function getBaseMonthlyPayment(debtId: string): number {
    if (!plan) return 0;
    const debt = plan.debts.find((d) => d.id === debtId);
    return debt?.monthlyPayment || 0;
  }

  // Check if a debt is receiving snowball in a given month
  function isSnowballRecipient(monthPlan: MonthlyPaymentPlan | null, debtId: string): boolean {
    if (!monthPlan || !plan) return false;
    const debtPayment = getDebtPaymentForMonth(monthPlan, debtId);
    if (!debtPayment || debtPayment.isPaidOff) return false;

    const priority = getDebtPriority(debtId);
    if (priority === 0) return false; // Priority 0 debts don't receive snowball

    const basePayment = getBaseMonthlyPayment(debtId);
    // If payment is significantly higher than base, it's receiving snowball
    return debtPayment.payment > basePayment + 0.01;
  }

  // Get all unique debts from the plan, sorted by priority
  const allDebts = $derived(() => {
    if (!plan) return [];
    const debtMap = new Map<string, PaydownDebt>();
    plan.debts.forEach((debt) => {
      debtMap.set(debt.id, debt);
    });
    const uniqueDebts = Array.from(debtMap.values());
    return sortDebtsByPriority(uniqueDebts);
  });
</script>

{#if plan}
  <div class="flex w-full flex-col gap-4">
    <!-- Saved Plan Details Display -->
    <div
      class="rounded-lg border-2 border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        <div class="flex items-center gap-2">
          <P size="sm" class="w-24 font-semibold">Start Date:</P>
          <P size="sm" class="text-neutral-700 dark:text-neutral-300">
            {new Date(plan.planStartDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </P>
        </div>
        <div class="flex items-center gap-2">
          <P size="sm" class="w-32 font-semibold">Years to Plan:</P>
          <P size="sm" class="text-neutral-700 dark:text-neutral-300">{plan.yearsToPlan}</P>
        </div>
        <div class="flex items-center gap-2">
          <P size="sm" class="w-40 font-semibold">Additional Snowball:</P>
          <P size="sm" class="text-neutral-700 dark:text-neutral-300">
            ${plan.additionalSnowball.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </P>
        </div>
        <div class="ml-auto flex items-center gap-2">
          {#if onDeletePlan}
            <DeleteIcon onclick={onDeletePlan} ariaLabel="Delete saved plan" />
          {/if}
        </div>
      </div>
    </div>

    <!-- Payment Plan Grid (Read-Only) -->
    {#if plan.paymentPlan.length > 0}
      <div class="flex w-full flex-col gap-6">
        {#each yearsData() as yearData, yearIndex}
          {@const isLoaded = loadedYears.has(yearIndex)}
          <div class="flex flex-col gap-2" data-year-index={yearIndex} use:setupYearObserver>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {yearData.year}
            </h3>

            {#if isLoaded}
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
                    {#each yearData.months as monthPlan}
                      <div
                        class="border-r border-b border-neutral-300 bg-neutral-100 px-2 py-2 text-center text-xs font-semibold last:border-r-0 dark:border-neutral-700 dark:bg-neutral-800"
                      >
                        {#if monthPlan}
                          <P size="xs">{monthPlan.paymentMonth.monthName}</P>
                        {:else}
                          <P size="xs" class="text-neutral-400">-</P>
                        {/if}
                      </div>
                    {/each}

                    <!-- Debt rows -->
                    {#each allDebts() as debt}
                      <div
                        class="sticky left-0 z-10 border-r border-neutral-300 bg-white px-4 py-2 font-semibold dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        <P size="sm" class="font-semibold">{debt.name}</P>
                      </div>
                      {#each yearData.months as monthPlan}
                        {@const debtPayment = getDebtPaymentForMonth(monthPlan, debt.id)}
                        {@const isSnowball = isSnowballRecipient(monthPlan, debt.id)}
                        <div
                          class="border-t border-r border-neutral-300 p-0 text-center last:border-r-0 dark:border-neutral-700 {isSnowball
                            ? 'dark:bg-aqua-200/30 bg-teal-800'
                            : 'bg-white dark:bg-neutral-900'}"
                        >
                          {#if monthPlan && debtPayment}
                            {#if debtPayment.isPaidOff}
                              <div class="flex flex-col items-center gap-1 px-2 py-2">
                                <P
                                  size="xs"
                                  class="font-semibold text-green-600 dark:text-green-400">Paid</P
                                >
                                <P size="xs" class="text-green-600 dark:text-green-400">
                                  ${Math.round(debtPayment.payment).toLocaleString()}
                                </P>
                              </div>
                            {:else}
                              <div class="flex flex-col gap-1 px-2 py-2">
                                <P
                                  size="xs"
                                  class="font-semibold text-neutral-900 dark:text-neutral-100"
                                >
                                  ${Math.round(debtPayment.payment).toLocaleString()}
                                </P>
                                <P
                                  size="xs"
                                  class="text-right text-neutral-500 dark:text-neutral-400"
                                >
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

                    <!-- Income rows -->
                    {#if plan.incomes.length > 0}
                      <div
                        class="sticky left-0 z-10 border-t-2 border-r border-neutral-400 bg-green-50 px-4 py-2 font-semibold dark:border-neutral-700 dark:bg-green-900/20"
                      >
                        <P size="sm" class="font-semibold">Income</P>
                      </div>
                      {#each yearData.months as monthPlan}
                        <div
                          class="border-t-2 border-r border-neutral-400 bg-green-50/50 px-2 py-2 text-center last:border-r-0 dark:border-neutral-700 dark:bg-green-900/10"
                        >
                          {#if monthPlan}
                            <P size="sm" class="font-semibold text-green-700 dark:text-green-400">
                              ${Math.round(monthPlan.totalIncome).toLocaleString()}
                            </P>
                          {:else}
                            <P size="xs" class="text-neutral-300 dark:text-neutral-600">-</P>
                          {/if}
                        </div>
                      {/each}

                      {#each plan.incomes as income}
                        <div
                          class="sticky left-0 z-10 border-t border-r border-neutral-300 bg-green-50 px-4 py-2 text-sm dark:border-neutral-700 dark:bg-green-900/20"
                        >
                          <P size="xs">{income.title}</P>
                        </div>
                        {#each yearData.months as monthPlan}
                          {@const incomeItem = monthPlan?.incomes.find((i) => i.id === income.id)}
                          <div
                            class="border-t border-r border-neutral-300 bg-green-50/50 px-2 py-1 text-center text-xs last:border-r-0 dark:border-neutral-700 dark:bg-green-900/10"
                          >
                            {#if monthPlan && incomeItem}
                              <P size="xs">
                                ${Math.round(incomeItem.amount).toLocaleString()}
                              </P>
                            {:else if monthPlan}
                              <P size="xs" class="text-neutral-400">-</P>
                            {:else}
                              <P size="xs" class="text-neutral-300 dark:text-neutral-600">-</P>
                            {/if}
                          </div>
                        {/each}
                      {/each}
                    {/if}

                    <!-- Recurring Expenses rows -->
                    {#if plan.recurringExpenses.length > 0}
                      <div
                        class="sticky left-0 z-10 border-t-2 border-r border-neutral-400 bg-red-50 px-4 py-2 font-semibold dark:border-neutral-700 dark:bg-red-900/20"
                      >
                        <P size="sm" class="font-semibold">Recurring Expenses</P>
                      </div>
                      {#each yearData.months as monthPlan}
                        <div
                          class="border-t-2 border-r border-neutral-400 bg-red-50/50 px-2 py-2 text-center last:border-r-0 dark:border-neutral-700 dark:bg-red-900/10"
                        >
                          {#if monthPlan}
                            <P size="sm" class="font-semibold text-red-700 dark:text-red-400">
                              ${Math.round(monthPlan.totalRecurringExpenses).toLocaleString()}
                            </P>
                          {:else}
                            <P size="xs" class="text-neutral-300 dark:text-neutral-600">-</P>
                          {/if}
                        </div>
                      {/each}

                      {#each plan.recurringExpenses as expense}
                        <div
                          class="sticky left-0 z-10 border-t border-r border-neutral-300 bg-red-50 px-4 py-2 text-sm dark:border-neutral-700 dark:bg-red-900/20"
                        >
                          <P size="xs">{expense.title}</P>
                        </div>
                        {#each yearData.months as monthPlan}
                          {@const expenseItem = monthPlan?.recurringExpenses.find(
                            (e) => e.id === expense.id,
                          )}
                          <div
                            class="border-t border-r border-neutral-300 bg-red-50/50 px-2 py-1 text-center text-xs last:border-r-0 dark:border-neutral-700 dark:bg-red-900/10"
                          >
                            {#if monthPlan && expenseItem}
                              <P size="xs">
                                ${Math.round(expenseItem.amount).toLocaleString()}
                              </P>
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
            {:else}
              <!-- Placeholder for unloaded year -->
              <div
                class="flex items-center justify-center rounded-lg border-2 border-neutral-300 bg-neutral-50 p-16 dark:border-neutral-700 dark:bg-neutral-800/50"
                style="min-height: 400px;"
              >
                <P size="sm" class="text-neutral-500 dark:text-neutral-400"
                  >Loading {yearData.year}...</P
                >
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div
        class="flex flex-col items-center justify-center rounded-lg border-2 border-neutral-300 p-8 dark:border-neutral-700"
      >
        <P size="base" class="text-neutral-600 dark:text-neutral-400"
          >No payment plan data available.</P
        >
      </div>
    {/if}
  </div>
{/if}
