<script lang="ts">
  import { P } from 'flowbite-svelte';
  import EditIcon from '$lib/components/EditIcon.svelte';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';
  import AddIcon from '$lib/components/AddIcon.svelte';
  import { getIncomes, getDebts, getRecurringExpenses } from '$lib/api/paydown.remote';
  import DeleteIncomeModal from './DeleteIncomeModal.svelte';

  let {
    activeScenarioId = $bindable<string | null>(null),
    onAddClick = () => {},
    onDelete = () => {},
    onEdit = () => {},
  } = $props();

  // NOTE: this is the suggested pattern to prevent waterfall effects,
  // however, I'm still seeing the warning.
  // https://svelte.dev/docs/svelte/runtime-warnings#Client-warnings-await_waterfall
  const incomesPromise = $derived(getIncomes(activeScenarioId));
  const debtsPromise = $derived(getDebts(activeScenarioId));
  const expensesPromise = $derived(getRecurringExpenses(activeScenarioId));

  const incomes = $derived(await incomesPromise);
  const debts = $derived(await debtsPromise);
  const expenses = $derived(await expensesPromise);

  const totalIncome = $derived(incomes.reduce((sum, income) => sum + income.amount, 0));
  const totalMonthlyPayments = $derived(debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0));
  const totalExpenses = $derived(expenses.reduce((sum, expense) => sum + expense.amount, 0));
  const remaining = $derived(totalIncome - totalMonthlyPayments - totalExpenses);

  // Delete modal state
  let deleteModalOpen = $state(false);
  let incomeToDelete = $state<{ id: string; title: string } | null>(null);

  function handleDelete(income: { id: string; title: string }) {
    incomeToDelete = income;
    deleteModalOpen = true;
  }

  function handleDeleteSuccess() {
    deleteModalOpen = false;
    if (incomeToDelete) {
      onDelete(incomeToDelete.id);
      incomeToDelete = null;
    }
  }

  function handleDeleteCancel() {
    deleteModalOpen = false;
    incomeToDelete = null;
  }
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
            <DeleteIcon onclick={() => handleDelete(income)} ariaLabel="Delete income" />
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

  {#if incomeToDelete}
    <DeleteIncomeModal
      bind:open={deleteModalOpen}
      incomeId={incomeToDelete.id}
      incomeTitle={incomeToDelete.title}
      onSuccess={handleDeleteSuccess}
      onCancel={handleDeleteCancel}
    />
  {/if}
</div>
