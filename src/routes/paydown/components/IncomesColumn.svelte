<script lang="ts">
  import { onMount } from 'svelte';
  import { P } from 'flowbite-svelte';
  import EditIcon from '$lib/components/EditIcon.svelte';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';
  import AddIcon from '$lib/components/AddIcon.svelte';
  import {
    getAllIncomes,
    getAllDebts,
    getAllRecurringExpenses,
    deleteIncome,
    getActiveScenarioId,
    type MonthlyIncome,
  } from '../helpers';

  let { onAddClick = () => {}, onDelete = () => {}, onEdit = () => {} } = $props();

  let incomes = $state<MonthlyIncome[]>([]);
  let previousScenarioId = $state<string | null>(null);

  function loadData() {
    incomes = getAllIncomes();
    previousScenarioId = getActiveScenarioId();
  }

  // Calculate totals
  const totalIncome = $derived(incomes.reduce((sum, income) => sum + income.amount, 0));

  // Calculate remaining (need debts and expenses for this)
  let debts = $state<ReturnType<typeof getAllDebts>>([]);
  let expenses = $state<ReturnType<typeof getAllRecurringExpenses>>([]);
  const totalMonthlyPayments = $derived(debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0));
  const totalExpenses = $derived(expenses.reduce((sum, expense) => sum + expense.amount, 0));
  const remaining = $derived(totalIncome - totalMonthlyPayments - totalExpenses);

  function loadDebtsAndExpenses() {
    debts = getAllDebts();
    expenses = getAllRecurringExpenses();
  }

  // Watch for scenario changes
  $effect(() => {
    const currentScenarioId = getActiveScenarioId();
    if (currentScenarioId !== previousScenarioId) {
      loadData();
      loadDebtsAndExpenses();
    }
  });

  function handleDelete(id: string) {
    deleteIncome(id);
    loadData();
    onDelete(id);
  }

  onMount(() => {
    loadData();
    loadDebtsAndExpenses();

    // Listen for data changes from drawers
    function handleDataChange() {
      loadData();
      loadDebtsAndExpenses();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('paydown-data-changed', handleDataChange);
      return () => {
        window.removeEventListener('paydown-data-changed', handleDataChange);
      };
    }
  });
</script>

<div class="flex flex-1 flex-col gap-4">
  <div class="flex items-center justify-between">
    <div class="flex flex-col gap-1">
      <P size="lg">Monthly Incomes</P>
      <div class="flex gap-4">
        <P size="sm" class="text-neutral-600 dark:text-neutral-400">
          Total: ${totalIncome.toLocaleString()}
        </P>
        <P
          size="sm"
          class={`font-semibold ${
            remaining >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          Remaining: ${remaining.toLocaleString()}
        </P>
      </div>
    </div>
    <AddIcon onclick={() => onAddClick()} ariaLabel="Add Income" />
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
          <div class="flex items-center gap-2">
            <EditIcon onclick={() => onEdit(income)} ariaLabel="Edit income" />
            <DeleteIcon onclick={() => handleDelete(income.id)} ariaLabel="Delete income" />
          </div>
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
