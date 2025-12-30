<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getAllDebts,
    deleteDebt,
    type PaydownDebt,
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

  onMount(() => {
    loadDebts();
    loadIncomes();
    loadRecurringExpenses();
  });
</script>

<!-- Two Column Layout -->
<div class="flex w-full flex-col gap-8 lg:flex-row lg:items-start">
  <IncomesColumn
    bind:incomes
    onAddClick={() => (incomeDrawerOpen = true)}
    onDelete={handleDeleteIncome}
  />
  <DebtsColumn bind:debts onAddClick={() => (debtDrawerOpen = true)} onDelete={handleDeleteDebt} />
  <RecurringExpensesColumn
    bind:recurringExpenses
    onAddClick={() => (recurringExpensesDrawerOpen = true)}
    onDelete={handleDeleteRecurringExpense}
  />
</div>

<AddDebtDrawer bind:open={debtDrawerOpen} onSuccess={loadDebts} />
<AddIncomeDrawer bind:open={incomeDrawerOpen} onSuccess={loadIncomes} />
<AddRecurringExpenseDrawer
  bind:open={recurringExpensesDrawerOpen}
  onSuccess={loadRecurringExpenses}
/>
