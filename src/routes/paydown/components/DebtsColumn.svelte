<script lang="ts">
  import { P } from 'flowbite-svelte';
  import EditIcon from '$lib/components/EditIcon.svelte';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';
  import AddIcon from '$lib/components/AddIcon.svelte';
  import { getDebts } from '$lib/api/paydown.remote';
  import { sortDebtsByPriority } from '../helpers';
  import DeleteDebtModal from './DeleteDebtModal.svelte';

  let {
    activeScenarioId = $bindable<string | null>(null),
    onAddClick = () => {},
    onDelete = () => {},
    onEdit = () => {},
  } = $props();

  const debts = $derived(activeScenarioId ? await getDebts(activeScenarioId) : []);

  // Calculate totals
  const totalDebt = $derived(debts.reduce((sum, debt) => sum + debt.amount, 0));

  // Delete modal state
  let deleteModalOpen = $state(false);
  let debtToDelete = $state<{ id: string; name: string } | null>(null);

  function handleDelete(debt: { id: string; name: string }) {
    debtToDelete = debt;
    deleteModalOpen = true;
  }

  function handleDeleteSuccess() {
    deleteModalOpen = false;
    if (debtToDelete) {
      onDelete(debtToDelete.id);
      debtToDelete = null;
    }
  }

  function handleDeleteCancel() {
    deleteModalOpen = false;
    debtToDelete = null;
  }
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
            <DeleteIcon onclick={() => handleDelete(debt)} ariaLabel="Delete debt" />
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

  {#if debtToDelete}
    <DeleteDebtModal
      bind:open={deleteModalOpen}
      debtId={debtToDelete.id}
      debtName={debtToDelete.name}
      onSuccess={handleDeleteSuccess}
      onCancel={handleDeleteCancel}
    />
  {/if}
</div>
