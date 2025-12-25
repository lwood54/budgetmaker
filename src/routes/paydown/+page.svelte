<script lang="ts">
  import { Button, P, Drawer } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import {
    addDebt,
    getAllDebts,
    deleteDebt,
    type PaydownDebt,
    type DebtType,
    addIncome,
    getAllIncomes,
    deleteIncome,
    type MonthlyIncome,
    addRecurringExpense,
    getAllRecurringExpenses,
    deleteRecurringExpense,
    type RecurringExpense,
  } from './helpers';
  import {
    generateSnowballPlan,
    recalculatePlanFromMonth,
    type MonthlyPaymentPlan,
  } from './helpers/paydownPlan';

  let debts = $state<PaydownDebt[]>([]);
  let incomes = $state<MonthlyIncome[]>([]);
  let recurringExpenses = $state<RecurringExpense[]>([]);
  let paymentPlan = $state<MonthlyPaymentPlan[]>([]);
  let debtDrawerOpen = $state(false);
  let incomeDrawerOpen = $state(false);
  let recurringExpensesDrawerOpen = $state(false);

  // Track edited payments per month: Map<monthIndex, Map<debtId, editedPayment>>
  let editedPayments = $state<Map<number, Map<string, number>>>(new Map());

  $inspect('paymentPlan', paymentPlan);

  // Debt form fields
  let name = $state('');
  let amount = $state('');
  let interestRate = $state('');
  let monthlyPayment = $state('');
  let debtType = $state<DebtType>('credit-card');

  // Plan generation fields
  let planStartDate = $state(new Date().toISOString().split('T')[0]); // Format: YYYY-MM-DD
  let yearsToPlan = $state(5);
  let additionalSnowball = $state('');

  // Income form fields
  let incomeTitle = $state('');
  let incomeAmount = $state('');

  // Recurring expense form fields
  let expenseTitle = $state('');
  let expenseAmount = $state('');

  function loadDebts() {
    debts = getAllDebts();
  }

  function loadIncomes() {
    incomes = getAllIncomes();
  }

  function loadRecurringExpenses() {
    recurringExpenses = getAllRecurringExpenses();
  }

  function handleDebtSubmit(e: SubmitEvent) {
    e.preventDefault();

    if (!name.trim()) return;

    addDebt({
      name: name.trim(),
      type: debtType,
      amount: parseFloat(amount) || 0,
      interestRate: parseFloat(interestRate) || 0,
      monthlyPayment: parseFloat(monthlyPayment) || 0,
    });

    // Reset form
    name = '';
    amount = '';
    interestRate = '';
    monthlyPayment = '';
    debtType = 'credit-card';

    // Reload debts
    loadDebts();

    // Close drawer
    debtDrawerOpen = false;
  }

  function handleIncomeSubmit(e: SubmitEvent) {
    e.preventDefault();

    if (!incomeTitle.trim()) return;

    addIncome({
      title: incomeTitle.trim(),
      amount: parseFloat(incomeAmount) || 0,
    });

    // Reset form
    incomeTitle = '';
    incomeAmount = '';

    // Reload incomes
    loadIncomes();

    // Close drawer
    incomeDrawerOpen = false;
  }

  function handleDeleteDebt(id: string) {
    deleteDebt(id);
    loadDebts();
  }

  function handleDeleteIncome(id: string) {
    deleteIncome(id);
    loadIncomes();
  }

  function handleRecurringExpenseSubmit(e: SubmitEvent) {
    e.preventDefault();

    if (!expenseTitle.trim()) return;

    addRecurringExpense({
      title: expenseTitle.trim(),
      amount: parseFloat(expenseAmount) || 0,
    });

    // Reset form
    expenseTitle = '';
    expenseAmount = '';

    // Reload recurring expenses
    loadRecurringExpenses();

    // Close drawer
    recurringExpensesDrawerOpen = false;
  }

  function handleDeleteRecurringExpense(id: string) {
    deleteRecurringExpense(id);
    loadRecurringExpenses();
  }

  function handleGeneratePlan() {
    if (debts.length === 0) return;

    const startDate = planStartDate ? new Date(planStartDate) : new Date();
    const additionalSnowballAmount = parseFloat(additionalSnowball) || 0;
    paymentPlan = generateSnowballPlan(
      debts,
      startDate,
      yearsToPlan,
      additionalSnowballAmount,
      incomes,
      recurringExpenses,
    );
    // Clear edited payments when generating new plan
    editedPayments = new Map();
  }

  function handlePaymentChange(monthIndex: number, debtId: string, value: string) {
    const paymentValue = parseFloat(value) || 0;

    if (!editedPayments.has(monthIndex)) {
      editedPayments.set(monthIndex, new Map());
    }

    const monthEdits = editedPayments.get(monthIndex)!;
    if (paymentValue > 0) {
      monthEdits.set(debtId, paymentValue);
    } else {
      monthEdits.delete(debtId);
    }
  }

  function handleUpdateMonth(monthIndex: number) {
    if (!editedPayments.has(monthIndex)) return;

    const monthEdits = editedPayments.get(monthIndex)!;
    if (monthEdits.size === 0) return;

    // Convert Map to Map<string, number> for the function
    const updatedPayments = new Map<string, number>();
    monthEdits.forEach((value, key) => {
      updatedPayments.set(key, value);
    });

    const additionalSnowballAmount = parseFloat(additionalSnowball) || 0;

    // Recalculate from this month forward
    paymentPlan = recalculatePlanFromMonth(
      paymentPlan,
      monthIndex,
      updatedPayments,
      debts,
      incomes,
      recurringExpenses,
      additionalSnowballAmount,
    );

    // Clear edits for this month after update
    editedPayments.delete(monthIndex);
  }

  function getEditedPayment(monthIndex: number, debtId: string): number | undefined {
    return editedPayments.get(monthIndex)?.get(debtId);
  }

  function hasEdits(monthIndex: number): boolean {
    return editedPayments.has(monthIndex) && editedPayments.get(monthIndex)!.size > 0;
  }

  onMount(() => {
    loadDebts();
    loadIncomes();
    loadRecurringExpenses();
  });
</script>

<div class="flex w-full flex-col gap-8 p-4">
  <!-- Header -->
  <div class="flex w-full items-center justify-center">
    <P size="xl">Paydown</P>
  </div>

  <!-- Two Column Layout -->
  <div class="flex w-full flex-col gap-8 lg:flex-row lg:items-start">
    <!-- Incomes Column -->
    <div class="flex flex-1 flex-col gap-4">
      <div class="flex items-center justify-between">
        <P size="lg">Monthly Incomes</P>
        <Button size="sm" onclick={() => (incomeDrawerOpen = true)}>Add Income</Button>
      </div>

      {#if incomes.length > 0}
        <div class="flex flex-col gap-3">
          {#each incomes as income (income.id)}
            <div
              class="flex items-center justify-between rounded-lg border border-neutral-300 p-4 dark:border-neutral-700"
            >
              <div class="flex flex-col gap-1">
                <P size="base" class="font-semibold">{income.title}</P>
                <P size="sm" class="text-neutral-600 dark:text-neutral-400">
                  ${income.amount.toLocaleString()}/mo
                </P>
              </div>
              <Button color="red" size="sm" onclick={() => handleDeleteIncome(income.id)}
                >Delete</Button
              >
            </div>
          {/each}
        </div>
      {:else}
        <div
          class="flex flex-col items-center justify-center rounded-lg border-2 border-neutral-300 p-8 dark:border-neutral-700"
        >
          <P size="base" class="text-neutral-600 dark:text-neutral-400">No incomes yet.</P>
        </div>
      {/if}
    </div>

    <!-- Debts Column -->
    <div class="flex flex-1 flex-col gap-4">
      <div class="flex items-center justify-between">
        <P size="lg">Paydown Debts</P>
        <Button size="sm" onclick={() => (debtDrawerOpen = true)}>Add Debt</Button>
      </div>

      {#if debts.length > 0}
        <div class="flex flex-col gap-3">
          {#each debts as debt (debt.id)}
            <div
              class="flex items-center justify-between rounded-lg border border-neutral-300 p-4 dark:border-neutral-700"
            >
              <div class="flex flex-col gap-1">
                <P size="base" class="font-semibold">{debt.name}</P>
                <P size="sm" class="text-neutral-600 dark:text-neutral-400">
                  Amount: ${debt.amount.toLocaleString()} | Rate: {debt.interestRate}% | Payment: ${debt.monthlyPayment.toLocaleString()}/mo
                </P>
              </div>
              <Button color="red" size="sm" onclick={() => handleDeleteDebt(debt.id)}>Delete</Button
              >
            </div>
          {/each}
        </div>
      {:else}
        <div
          class="flex flex-col items-center justify-center rounded-lg border-2 border-neutral-300 p-8 dark:border-neutral-700"
        >
          <P size="base" class="text-neutral-600 dark:text-neutral-400">No debts yet.</P>
        </div>
      {/if}
    </div>

    <!-- Recurring Expenses Column -->
    <div class="flex flex-1 flex-col gap-4">
      <div class="flex items-center justify-between">
        <P size="lg">Recurring Expenses</P>
        <Button size="sm" onclick={() => (recurringExpensesDrawerOpen = true)}
          >Add Recurring Expense</Button
        >
      </div>

      {#if recurringExpenses.length > 0}
        <div class="flex flex-col gap-3">
          {#each recurringExpenses as expense (expense.id)}
            <div
              class="flex items-center justify-between rounded-lg border border-neutral-300 p-4 dark:border-neutral-700"
            >
              <div class="flex flex-col gap-1">
                <P size="base" class="font-semibold">{expense.title}</P>
                <P size="sm" class="text-neutral-600 dark:text-neutral-400">
                  ${expense.amount.toLocaleString()}/mo
                </P>
              </div>
              <Button color="red" size="sm" onclick={() => handleDeleteRecurringExpense(expense.id)}
                >Delete</Button
              >
            </div>
          {/each}
        </div>
      {:else}
        <div
          class="flex flex-col items-center justify-center rounded-lg border-2 border-neutral-300 p-8 dark:border-neutral-700"
        >
          <P size="base" class="text-neutral-600 dark:text-neutral-400"
            >No recurring expenses yet.</P
          >
        </div>
      {/if}
    </div>
  </div>

  <!-- Generate Plan Section -->
  <div class="flex w-full flex-col gap-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <P size="lg">Payment Plan</P>
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <P size="sm">Start Date:</P>
          <input
            type="date"
            bind:value={planStartDate}
            class="rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div class="flex items-center gap-2">
          <P size="sm">Years to Plan:</P>
          <input
            type="number"
            bind:value={yearsToPlan}
            min="1"
            max="50"
            class="w-20 rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div class="flex items-center gap-2">
          <P size="sm">Additional Snowball:</P>
          <input
            type="number"
            bind:value={additionalSnowball}
            step="0.01"
            min="0"
            placeholder="0.00"
            class="w-32 rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <Button onclick={handleGeneratePlan} disabled={debts.length === 0}>Generate Plan</Button>
      </div>
    </div>

    {#if paymentPlan.length > 0}
      <div class="flex flex-col gap-4">
        <div class="rounded-lg border border-neutral-300 p-4 dark:border-neutral-700">
          <P size="sm" class="text-neutral-600 dark:text-neutral-400">
            Total months to pay off all debts: {paymentPlan.length} | Total interest: ${paymentPlan
              .reduce((sum, month) => sum + month.totalInterest, 0)
              .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </P>
        </div>

        <div class="rounded-lg border border-neutral-300 dark:border-neutral-700">
          <div class="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-700">
            {#each paymentPlan as monthPlan, monthIndex (monthPlan.paymentMonth.monthName + monthPlan.paymentMonth.year)}
              <div class="flex flex-col gap-4 p-4">
                <div class="flex items-center justify-between">
                  <P size="base" class="font-semibold">{monthPlan.paymentMonth.monthName}</P>
                </div>

                <!-- Incomes Section -->
                {#if monthPlan.incomes.length > 0}
                  <div class="flex flex-col gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <P size="sm" class="font-semibold text-green-700 dark:text-green-400">Incomes</P
                    >
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
                    <div class="flex items-center justify-between">
                      <P size="sm" class="font-semibold text-red-700 dark:text-red-400"
                        >Debt Payments</P
                      >
                      {#if hasEdits(monthIndex)}
                        <Button
                          size="xs"
                          color="primary"
                          onclick={() => handleUpdateMonth(monthIndex)}
                        >
                          Update
                        </Button>
                      {/if}
                    </div>
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
                            <P size="sm" class="text-green-600 dark:text-green-400">Paid Off!</P>
                          {:else}
                            <input
                              type="number"
                              value={getEditedPayment(monthIndex, debtPayment.debtId) ??
                                debtPayment.payment}
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
                  <div
                    class="flex flex-col gap-2 rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20"
                  >
                    <P size="sm" class="font-semibold text-orange-700 dark:text-orange-400"
                      >Recurring Expenses</P
                    >
                    {#each monthPlan.recurringExpenses as expense}
                      <div class="flex items-center justify-between pl-4 text-sm">
                        <P size="sm" class="text-orange-600 dark:text-orange-300">{expense.title}</P
                        >
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
    {:else if debts.length > 0}
      <div
        class="flex flex-col items-center justify-center rounded-lg border-2 border-neutral-300 p-8 dark:border-neutral-700"
      >
        <P size="base" class="text-neutral-600 dark:text-neutral-400"
          >Click "Generate Plan" to create your snowball payment plan.</P
        >
      </div>
    {:else}
      <div
        class="flex flex-col items-center justify-center rounded-lg border-2 border-neutral-300 p-8 dark:border-neutral-700"
      >
        <P size="base" class="text-neutral-600 dark:text-neutral-400"
          >Add debts to generate a payment plan.</P
        >
      </div>
    {/if}
  </div>
</div>

<!-- Add Debt Drawer -->
<Drawer bind:open={debtDrawerOpen} placement="right" class="z-50">
  <div class="flex max-h-[100vh] w-full max-w-md flex-col bg-white dark:bg-neutral-800">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
    >
      <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">Add Debt</P>
    </div>

    <!-- Form Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <form onsubmit={handleDebtSubmit} class="flex flex-col gap-4">
        <div>
          <P size="sm" class="mb-2">Debt Name</P>
          <input
            type="text"
            bind:value={name}
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div>
          <P size="sm" class="mb-2">Debt Type</P>
          <select
            bind:value={debtType}
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          >
            <option value="credit-card">Credit Card</option>
            <option value="car">Car Loan</option>
            <option value="mortgage">Mortgage</option>
            <option value="student-loan">Student Loan</option>
            <option value="personal-loan">Personal Loan</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <P size="sm" class="mb-2">Debt Amount</P>
          <input
            type="number"
            bind:value={amount}
            step="0.01"
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div>
          <P size="sm" class="mb-2">Interest Rate (%)</P>
          <input
            type="number"
            bind:value={interestRate}
            step="0.01"
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div>
          <P size="sm" class="mb-2">Monthly Payment</P>
          <input
            type="number"
            bind:value={monthlyPayment}
            step="0.01"
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div class="flex gap-4 pt-4">
          <Button
            type="button"
            color="alternative"
            class="flex-1"
            onclick={() => (debtDrawerOpen = false)}
          >
            Cancel
          </Button>
          <Button type="submit" class="flex-1">Add Debt</Button>
        </div>
      </form>
    </div>
  </div>
</Drawer>

<!-- Add Income Drawer -->
<Drawer bind:open={incomeDrawerOpen} placement="right" class="z-50">
  <div class="flex max-h-[100vh] w-full max-w-md flex-col bg-white dark:bg-neutral-800">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
    >
      <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">Add Income</P>
    </div>

    <!-- Form Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <form onsubmit={handleIncomeSubmit} class="flex flex-col gap-4">
        <div>
          <P size="sm" class="mb-2">Title</P>
          <input
            type="text"
            bind:value={incomeTitle}
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div>
          <P size="sm" class="mb-2">Monthly Amount</P>
          <input
            type="number"
            bind:value={incomeAmount}
            step="0.01"
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div class="flex gap-4 pt-4">
          <Button
            type="button"
            color="alternative"
            class="flex-1"
            onclick={() => (incomeDrawerOpen = false)}
          >
            Cancel
          </Button>
          <Button type="submit" class="flex-1">Add Income</Button>
        </div>
      </form>
    </div>
  </div>
</Drawer>

<!-- Add Recurring Expense Drawer -->
<Drawer bind:open={recurringExpensesDrawerOpen} placement="right" class="z-50">
  <div class="flex max-h-[100vh] w-full max-w-md flex-col bg-white dark:bg-neutral-800">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
    >
      <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold"
        >Add Recurring Expense</P
      >
    </div>

    <!-- Form Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <form onsubmit={handleRecurringExpenseSubmit} class="flex flex-col gap-4">
        <div>
          <P size="sm" class="mb-2">Title</P>
          <input
            type="text"
            bind:value={expenseTitle}
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div>
          <P size="sm" class="mb-2">Monthly Amount</P>
          <input
            type="number"
            bind:value={expenseAmount}
            step="0.01"
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div class="flex gap-4 pt-4">
          <Button
            type="button"
            color="alternative"
            class="flex-1"
            onclick={() => (recurringExpensesDrawerOpen = false)}
          >
            Cancel
          </Button>
          <Button type="submit" class="flex-1">Add Expense</Button>
        </div>
      </form>
    </div>
  </div>
</Drawer>
