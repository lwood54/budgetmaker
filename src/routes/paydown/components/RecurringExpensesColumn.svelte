<script lang="ts">
  import { P } from 'flowbite-svelte';
  import EditIcon from '$lib/components/EditIcon.svelte';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';
  import AddIcon from '$lib/components/AddIcon.svelte';
  import { getRecurringExpenses } from '$lib/api/paydown.remote';
  import DeleteRecurringExpenseModal from './DeleteRecurringExpenseModal.svelte';

  let {
    activeScenarioId = $bindable<string | null>(null),
    onAddClick = () => {},
    onDelete = () => {},
    onEdit = () => {},
  } = $props();

  const recurringExpenses = $derived(
    activeScenarioId ? await getRecurringExpenses(activeScenarioId) : [],
  );

  // Calculate totals
  const totalExpenses = $derived(
    recurringExpenses.reduce((sum, expense) => sum + expense.amount, 0),
  );

  // Delete modal state
  let deleteModalOpen = $state(false);
  let expenseToDelete = $state<{ id: string; title: string } | null>(null);

  function handleDelete(expense: { id: string; title: string }) {
    expenseToDelete = expense;
    deleteModalOpen = true;
  }

  function handleDeleteSuccess() {
    deleteModalOpen = false;
    if (expenseToDelete) {
      onDelete(expenseToDelete.id);
      expenseToDelete = null;
    }
  }

  function handleDeleteCancel() {
    deleteModalOpen = false;
    expenseToDelete = null;
  }
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
              onclick={() => handleDelete(expense)}
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

  {#if expenseToDelete}
    <DeleteRecurringExpenseModal
      bind:open={deleteModalOpen}
      expenseId={expenseToDelete.id}
      expenseTitle={expenseToDelete.title}
      onSuccess={handleDeleteSuccess}
      onCancel={handleDeleteCancel}
    />
  {/if}
</div>
