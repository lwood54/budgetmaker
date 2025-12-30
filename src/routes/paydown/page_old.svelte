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
    sortDebtsByPriority,
  } from './helpers';
  import {
    generateSnowballPlan,
    recalculatePlanFromMonth,
    type MonthlyPaymentPlan,
  } from './helpers/paydownPlan';
  // import PaymentPlanGrid from './components/PaymentPlanGrid.svelte';
  import PaymentPlanSpreadsheet from './components/PaymentPlanSpreadsheet.svelte';
  // import PaymentPlanCardView from './components/PaymentPlanCardView.svelte'; // Old card view - kept for reference

  let debts = $state<PaydownDebt[]>([]);
  let incomes = $state<MonthlyIncome[]>([]);
  let recurringExpenses = $state<RecurringExpense[]>([]);
  let paymentPlan = $state<MonthlyPaymentPlan[]>([]);
  let debtDrawerOpen = $state(false);
  let incomeDrawerOpen = $state(false);
  let recurringExpensesDrawerOpen = $state(false);
  let activeTab = $state<'setup' | 'plan' | 'saved'>('setup');

  // Track edited payments per month: { monthIndex: { debtId: editedPayment } }
  let editedPayments = $state<Record<number, Record<string, number>>>({});

  // Track original payments for comparison: { monthIndex: { debtId: originalPayment } }
  let originalPayments = $state<Record<number, Record<string, number>>>({});

  // Track all manually edited payments across all months (persists after updates)
  // This is the source of truth for which fields have been manually edited
  let manuallyEditedPayments = $state<Record<number, Record<string, number>>>({});

  $inspect('paymentPlan', paymentPlan);

  // Debt form fields
  let name = $state('');
  let amount = $state('');
  let interestRate = $state('');
  let monthlyPayment = $state('');
  let debtType = $state<DebtType>('credit-card');
  let priority = $state('1');

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
      priority: parseInt(priority) || 0,
    });

    // Reset form
    name = '';
    amount = '';
    interestRate = '';
    monthlyPayment = '';
    debtType = 'credit-card';
    priority = '1';

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
    console.info('handleGeneratePlan');

    if (debts.length === 0) return;

    const startDate = planStartDate ? new Date(planStartDate) : new Date();
    const additionalSnowballAmount = parseFloat(additionalSnowball) || 0;
    console.info('startDate', startDate);
    console.info('additionalSnowballAmount', additionalSnowballAmount);

    // Generate plan in a batch to prevent cascading reactive updates
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

    console.info('Plan generated:', newPlan.length, 'months');
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

<div class="flex w-full flex-col gap-8 p-4">
  <!-- Header -->
  <div class="flex w-full items-center justify-center">
    <P size="xl">Paydown</P>
  </div>

  <!-- Tabs -->
  <div class="flex w-full flex-col gap-4">
    <div class="flex gap-2 border-b border-neutral-200 dark:border-neutral-700">
      <button
        class="px-4 py-2 font-medium transition-colors {activeTab === 'setup'
          ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 border-b-2'
          : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'}"
        onclick={() => (activeTab = 'setup')}
      >
        Setup
      </button>
      <button
        class="px-4 py-2 font-medium transition-colors {activeTab === 'plan'
          ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 border-b-2'
          : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'}"
        onclick={() => (activeTab = 'plan')}
      >
        Generated Plan
      </button>
      <button
        class="px-4 py-2 font-medium transition-colors {activeTab === 'saved'
          ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 border-b-2'
          : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'}"
        onclick={() => (activeTab = 'saved')}
      >
        Saved Plans
      </button>
    </div>

    {#if activeTab === 'setup'}
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
              {#each sortDebtsByPriority(debts) as debt (debt.id)}
                <div
                  class="flex items-center justify-between rounded-lg border border-neutral-300 p-4 dark:border-neutral-700"
                >
                  <div class="flex flex-col gap-1">
                    <P size="base" class="font-semibold">{debt.name}</P>
                    <P size="sm" class="text-neutral-600 dark:text-neutral-400">
                      Amount: ${debt.amount.toLocaleString()} | Rate: {debt.interestRate}% |
                      Payment: ${debt.monthlyPayment.toLocaleString()}/mo | Priority: {debt.priority ||
                        0}
                    </P>
                  </div>
                  <Button color="red" size="sm" onclick={() => handleDeleteDebt(debt.id)}
                    >Delete</Button
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
                  <Button
                    color="red"
                    size="sm"
                    onclick={() => handleDeleteRecurringExpense(expense.id)}>Delete</Button
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
    {/if}

    {#if activeTab === 'plan'}
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
            <Button onclick={handleGeneratePlan} disabled={debts.length === 0}>Generate Plan</Button
            >
          </div>
        </div>

        <!-- <PaymentPlanGrid
          {paymentPlan}
          {debts}
          {hasEdits}
          {handleUpdateMonth}
          {getDisplayPayment}
          {handlePaymentChange}
        /> -->
        <PaymentPlanSpreadsheet
          {paymentPlan}
          {debts}
          {hasEdits}
          {handleUpdateMonth}
          {getDisplayPayment}
          {handlePaymentChange}
        />
      </div>
    {/if}

    {#if activeTab === 'saved'}
      <div
        class="flex flex-col items-center justify-center rounded-lg border-2 border-neutral-300 p-8 dark:border-neutral-700"
      >
        <P size="base" class="text-neutral-600 dark:text-neutral-400"
          >Saved plans feature coming soon.</P
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
        <div>
          <P size="sm" class="mb-2">Priority (1 = highest, 0 = skip snowball)</P>
          <input
            type="number"
            bind:value={priority}
            min="0"
            step="1"
            placeholder="1"
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
