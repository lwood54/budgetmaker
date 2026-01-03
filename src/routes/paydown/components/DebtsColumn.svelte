<script lang="ts">
  import { onMount } from 'svelte';
  import { P } from 'flowbite-svelte';
  import EditIcon from '$lib/components/EditIcon.svelte';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';
  import AddIcon from '$lib/components/AddIcon.svelte';
  import {
    getAllDebts,
    deleteDebt,
    getActiveScenarioId,
    sortDebtsByPriority,
    type PaydownDebt,
  } from '../helpers';

  let { onAddClick = () => {}, onDelete = () => {}, onEdit = () => {} } = $props();

  let debts = $state<PaydownDebt[]>([]);
  let previousScenarioId = $state<string | null>(null);

  function loadData() {
    debts = getAllDebts();
    previousScenarioId = getActiveScenarioId();
  }

  // Calculate totals
  const totalDebt = $derived(debts.reduce((sum, debt) => sum + debt.amount, 0));

  // Watch for scenario changes
  $effect(() => {
    const currentScenarioId = getActiveScenarioId();
    if (currentScenarioId !== previousScenarioId) {
      loadData();
    }
  });

  function handleDelete(id: string) {
    deleteDebt(id);
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
      <P size="lg">Paydown Debts</P>
      <P size="sm" class="text-neutral-600 dark:text-neutral-400">
        Total: ${totalDebt.toLocaleString()}
      </P>
    </div>
    <AddIcon onclick={() => onAddClick()} ariaLabel="Add Debt" />
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
              Amount: ${debt.amount.toLocaleString()} | Rate: {debt.interestRate}% | Payment: ${debt.monthlyPayment.toLocaleString()}/mo
              | Priority: {debt.priority || 0}
            </P>
          </div>
          <div class="flex items-center gap-2">
            <EditIcon onclick={() => onEdit(debt)} ariaLabel="Edit debt" />
            <DeleteIcon onclick={() => handleDelete(debt.id)} ariaLabel="Delete debt" />
          </div>
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
