<script lang="ts">
  import { onMount } from 'svelte';
  import { P } from 'flowbite-svelte';
  import {
    getAllDebts,
    type PaydownDebt,
    deleteDebt,
    getAllIncomes,
    deleteIncome,
    type MonthlyIncome,
    getAllRecurringExpenses,
    deleteRecurringExpense,
    type RecurringExpense,
  } from '../helpers';
  import AddDebtDrawer from './AddDebtDrawer.svelte';
  import AddIncomeDrawer from './AddIncomeDrawer.svelte';
  import AddRecurringExpenseDrawer from './AddRecurringExpenseDrawer.svelte';
  import IncomesColumn from './IncomesColumn.svelte';
  import DebtsColumn from './DebtsColumn.svelte';
  import RecurringExpensesColumn from './RecurringExpensesColumn.svelte';

  let debts = $state<PaydownDebt[]>([]);

  let incomes = $state<MonthlyIncome[]>([]);
  let recurringExpenses = $state<RecurringExpense[]>([]);
  let debtDrawerOpen = $state(false);
  let incomeDrawerOpen = $state(false);
  let recurringExpensesDrawerOpen = $state(false);

  // Edit state
  let editingDebt = $state<PaydownDebt | null>(null);
  let editingIncome = $state<MonthlyIncome | null>(null);
  let editingExpense = $state<RecurringExpense | null>(null);

  // Calculate totals
  const totalIncome = $derived(incomes.reduce((sum, income) => sum + income.amount, 0));
  const totalDebtAmount = $derived(debts.reduce((sum, debt) => sum + debt.amount, 0));
  const totalMonthlyPayments = $derived(debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0));
  const totalExpenses = $derived(
    recurringExpenses.reduce((sum, expense) => sum + expense.amount, 0),
  );
  const remaining = $derived(totalIncome - totalMonthlyPayments - totalExpenses);
  function loadDebts() {
    debts = getAllDebts();
  }

  function loadIncomes() {
    incomes = getAllIncomes();
  }

  function loadRecurringExpenses() {
    recurringExpenses = getAllRecurringExpenses();
  }

  function handleDeleteDebt(id: string) {
    deleteDebt(id);
    loadDebts();
  }

  function handleDeleteIncome(id: string) {
    deleteIncome(id);
    loadIncomes();
  }

  function handleDeleteRecurringExpense(id: string) {
    deleteRecurringExpense(id);
    loadRecurringExpenses();
  }

  function handleEditDebt(debt: PaydownDebt) {
    editingDebt = debt;
    debtDrawerOpen = true;
  }

  function handleEditIncome(income: MonthlyIncome) {
    editingIncome = income;
    incomeDrawerOpen = true;
  }

  function handleEditRecurringExpense(expense: RecurringExpense) {
    editingExpense = expense;
    recurringExpensesDrawerOpen = true;
  }

  onMount(() => {
    loadDebts();
    loadIncomes();
    loadRecurringExpenses();
  });
</script>

<div
  class="mb-6 rounded-lg border-2 border-neutral-300 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50"
>
  <div class="mb-4 flex items-center gap-3">
    <P size="lg" class="font-semibold">Financial Summary</P>
    <P size="sm" class="text-neutral-600 dark:text-neutral-400">
      Total Debt: ${totalDebtAmount.toLocaleString()}
    </P>

    <P
      size="sm"
      class={`font-bold ${
        remaining >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
      }`}
    >
      Remaining: ${remaining.toLocaleString()}
    </P>
  </div>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
    <div
      class="rounded-lg border-2 border-green-500 bg-green-50 p-4 dark:border-green-400 dark:bg-green-900/20"
    >
      <P size="sm" class="text-green-700 dark:text-green-400">Total Monthly Income</P>
      <P size="xl" class="font-bold text-green-700 dark:text-green-400">
        ${totalIncome.toLocaleString()}
      </P>
    </div>

    <div
      class="rounded-lg border-2 border-red-500 bg-red-50 p-4 dark:border-red-400 dark:bg-red-900/20"
    >
      <P size="sm" class="text-red-700 dark:text-red-400">Total Monthly Payments</P>
      <P size="xl" class="font-bold text-red-700 dark:text-red-400">
        ${totalMonthlyPayments.toLocaleString()}
      </P>
    </div>

    <div
      class="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 dark:border-orange-400 dark:bg-orange-900/20"
    >
      <P size="sm" class="text-orange-700 dark:text-orange-400">Total Monthly Expenses</P>
      <P size="xl" class="font-bold text-orange-700 dark:text-orange-400">
        ${totalExpenses.toLocaleString()}
      </P>
    </div>
  </div>
</div>

<div
  class="rounded-lg border-2 border-neutral-300 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50"
>
  <div class="flex w-full flex-col gap-8 lg:flex-row lg:items-start">
    <IncomesColumn
      bind:incomes
      onAddClick={() => {
        editingIncome = null;
        incomeDrawerOpen = true;
      }}
      onDelete={handleDeleteIncome}
      onEdit={handleEditIncome}
    />
    <DebtsColumn
      bind:debts
      onAddClick={() => {
        editingDebt = null;
        debtDrawerOpen = true;
      }}
      onDelete={handleDeleteDebt}
      onEdit={handleEditDebt}
    />
    <RecurringExpensesColumn
      bind:recurringExpenses
      onAddClick={() => {
        editingExpense = null;
        recurringExpensesDrawerOpen = true;
      }}
      onDelete={handleDeleteRecurringExpense}
      onEdit={handleEditRecurringExpense}
    />
  </div>
</div>

<AddDebtDrawer
  bind:open={debtDrawerOpen}
  bind:editingDebt
  onSuccess={() => {
    loadDebts();
    editingDebt = null;
  }}
/>
<AddIncomeDrawer
  bind:open={incomeDrawerOpen}
  bind:editingIncome
  onSuccess={() => {
    loadIncomes();
    editingIncome = null;
  }}
/>
<AddRecurringExpenseDrawer
  bind:open={recurringExpensesDrawerOpen}
  bind:editingExpense
  onSuccess={() => {
    loadRecurringExpenses();
    editingExpense = null;
  }}
/>
