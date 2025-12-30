<script lang="ts">
  import { Button, P } from 'flowbite-svelte';
  import type { MonthlyPaymentPlan } from '../helpers/paydownPlan';

  type Props = {
    paymentPlan: MonthlyPaymentPlan[];
    hasEdits: (monthIndex: number) => boolean;
    handleUpdateMonth: (monthIndex: number) => void;
    getDisplayPayment: (monthIndex: number, debtId: string, defaultPayment: number) => number;
    handlePaymentChange: (monthIndex: number, debtId: string, value: string) => void;
  };

  let { paymentPlan, hasEdits, handleUpdateMonth, getDisplayPayment, handlePaymentChange }: Props =
    $props();
</script>

{#if paymentPlan.length > 0}
  <div class="flex flex-col gap-4">
    <div class="rounded-lg border border-neutral-300 p-4 dark:border-neutral-700">
      <P size="sm" class="text-neutral-600 dark:text-neutral-400">
        Total months to pay off all debts: {paymentPlan.length} | Total interest: ${paymentPlan
          .reduce((sum, month) => sum + month.totalInterest, 0)
          .toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
      </P>
    </div>

    <div class="rounded-lg border border-neutral-300 dark:border-neutral-700">
      <div class="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-700">
        {#each paymentPlan as monthPlan, monthIndex (monthPlan.paymentMonth.monthName + monthPlan.paymentMonth.year)}
          <div class="flex flex-col gap-4 p-4">
            <div class="flex items-center justify-between">
              <P size="base" class="font-semibold">{monthPlan.paymentMonth.monthName}</P>
              <Button
                size="xs"
                color="primary"
                disabled={!hasEdits(monthIndex)}
                onclick={() => handleUpdateMonth(monthIndex)}
              >
                Update Month
              </Button>
            </div>

            <!-- Incomes Section -->
            {#if monthPlan.incomes.length > 0}
              <div class="flex flex-col gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                <P size="sm" class="font-semibold text-green-700 dark:text-green-400">Incomes</P>
                {#each monthPlan.incomes as income}
                  <div class="flex items-center justify-between pl-4 text-sm">
                    <P size="sm" class="text-green-600 dark:text-green-300">{income.title}</P>
                    <P size="sm" class="text-green-600 dark:text-green-300">
                      +${income.amount.toLocaleString()}
                    </P>
                  </div>
                {/each}
                <div
                  class="flex items-center justify-between border-t border-green-200 pt-2 dark:border-green-800"
                >
                  <P size="sm" class="font-semibold text-green-700 dark:text-green-400"
                    >Total Income</P
                  >
                  <P size="sm" class="font-semibold text-green-700 dark:text-green-400">
                    +${monthPlan.totalIncome.toLocaleString()}
                  </P>
                </div>
              </div>
            {/if}

            <!-- Debt Payments Section -->
            {#if monthPlan.debtPayments.length > 0}
              <div class="flex flex-col gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <P size="sm" class="font-semibold text-red-700 dark:text-red-400">Debt Payments</P>
                {#each monthPlan.debtPayments as debtPayment}
                  <div class="flex items-center justify-between pl-4 text-sm">
                    <P
                      size="sm"
                      class={debtPayment.isPaidOff
                        ? 'text-neutral-500 line-through'
                        : 'text-red-600 dark:text-red-300'}
                    >
                      {debtPayment.debtName}
                      {#if !debtPayment.isPaidOff}
                        {' '}(Balance: ${debtPayment.balance.toLocaleString()})
                      {/if}
                    </P>
                    <div class="flex items-center gap-2">
                      {#if debtPayment.isPaidOff}
                        <div class="flex flex-col items-end gap-1">
                          <P size="sm" class="text-green-600 dark:text-green-400">Paid Off!</P>
                          <P size="xs" class="text-green-600 dark:text-green-400">
                            ${debtPayment.payment.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </P>
                        </div>
                      {:else}
                        <input
                          type="number"
                          value={getDisplayPayment(
                            monthIndex,
                            debtPayment.debtId,
                            debtPayment.payment,
                          )}
                          oninput={(e) =>
                            handlePaymentChange(
                              monthIndex,
                              debtPayment.debtId,
                              e.currentTarget.value,
                            )}
                          step="0.01"
                          min="0"
                          class="w-24 rounded border border-red-300 bg-white px-2 py-1 text-right text-sm text-red-600 dark:border-red-700 dark:bg-neutral-800 dark:text-red-300"
                        />
                      {/if}
                    </div>
                  </div>
                {/each}
                <div
                  class="flex items-center justify-between border-t border-red-200 pt-2 dark:border-red-800"
                >
                  <P size="sm" class="font-semibold text-red-700 dark:text-red-400"
                    >Total Debt Payments</P
                  >
                  <P size="sm" class="font-semibold text-red-700 dark:text-red-400">
                    -${monthPlan.totalPayment.toLocaleString()}
                  </P>
                </div>
              </div>
            {/if}

            <!-- Recurring Expenses Section -->
            {#if monthPlan.recurringExpenses.length > 0}
              <div class="flex flex-col gap-2 rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                <P size="sm" class="font-semibold text-orange-700 dark:text-orange-400"
                  >Recurring Expenses</P
                >
                {#each monthPlan.recurringExpenses as expense}
                  <div class="flex items-center justify-between pl-4 text-sm">
                    <P size="sm" class="text-orange-600 dark:text-orange-300">{expense.title}</P>
                    <P size="sm" class="text-orange-600 dark:text-orange-300">
                      -${expense.amount.toLocaleString()}
                    </P>
                  </div>
                {/each}
                <div
                  class="flex items-center justify-between border-t border-orange-200 pt-2 dark:border-orange-800"
                >
                  <P size="sm" class="font-semibold text-orange-700 dark:text-orange-400"
                    >Total Recurring Expenses</P
                  >
                  <P size="sm" class="font-semibold text-orange-700 dark:text-orange-400">
                    -${monthPlan.totalRecurringExpenses.toLocaleString()}
                  </P>
                </div>
              </div>
            {/if}

            <!-- Remaining Balance -->
            <div
              class="flex items-center justify-between rounded-lg border-2 p-3 {monthPlan.remainingBalance >=
              0
                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'}"
            >
              <P size="base" class="font-semibold">Remaining Balance</P>
              <P
                size="base"
                class="font-bold {monthPlan.remainingBalance >= 0
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'}"
              >
                ${monthPlan.remainingBalance >= 0
                  ? '+'
                  : ''}${monthPlan.remainingBalance.toLocaleString()}
              </P>
            </div>
          </div>
        {/each}
      </div>
    </div>
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
