<script lang="ts">
  import { onMount } from 'svelte';
  import { P } from 'flowbite-svelte';
  import EditIcon from '$lib/components/EditIcon.svelte';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';
  import AddIcon from '$lib/components/AddIcon.svelte';
  import {
    getAllRecurringExpenses,
    deleteRecurringExpense,
    getActiveScenarioId,
    type RecurringExpense,
  } from '../helpers';

  let { onAddClick = () => {}, onDelete = () => {}, onEdit = () => {} } = $props();

  let recurringExpenses = $state<RecurringExpense[]>([]);
  let previousScenarioId = $state<string | null>(null);

  function loadData() {
    recurringExpenses = getAllRecurringExpenses();
    previousScenarioId = getActiveScenarioId();
  }

  // Calculate totals
  const totalExpenses = $derived(
    recurringExpenses.reduce((sum, expense) => sum + expense.amount, 0),
  );

  // Watch for scenario changes
  $effect(() => {
    const currentScenarioId = getActiveScenarioId();
    if (currentScenarioId !== previousScenarioId) {
      loadData();
    }
  });

  function handleDelete(id: string) {
    deleteRecurringExpense(id);
    loadData();
    onDelete(id);
  }

  onMount(() => {
    loadData();

    // Listen for data changes from drawers
    function handleDataChange() {
      loadData();
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
      <P size="lg">Recurring Expenses</P>
      <P size="sm" class="text-neutral-600 dark:text-neutral-400">
        Total: ${totalExpenses.toLocaleString()}
      </P>
    </div>
    <AddIcon onclick={() => onAddClick()} ariaLabel="Add Recurring Expense" />
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
          <div class="flex items-center gap-2">
            <EditIcon onclick={() => onEdit(expense)} ariaLabel="Edit recurring expense" />
            <DeleteIcon
              onclick={() => handleDelete(expense.id)}
              ariaLabel="Delete recurring expense"
            />
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div
      class="flex flex-col items-center justify-center rounded-lg border-2 border-neutral-300 p-8 dark:border-neutral-700"
    >
      <P size="base" class="text-neutral-600 dark:text-neutral-400">No recurring expenses yet.</P>
    </div>
  {/if}
</div>
