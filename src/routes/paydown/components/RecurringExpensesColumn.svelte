<script lang="ts">
  import { Button, P } from 'flowbite-svelte';
  import type { RecurringExpense } from '../helpers';

  let {
    recurringExpenses = $bindable([]),
    onAddClick = () => {},
    onDelete = () => {},
    onEdit = () => {},
  } = $props();
</script>

<div class="flex flex-1 flex-col gap-4">
  <div class="flex items-center justify-between">
    <P size="lg">Recurring Expenses</P>
    <Button size="sm" onclick={() => onAddClick()}>Add Recurring Expense</Button>
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
          <div class="flex gap-2">
            <Button size="sm" onclick={() => onEdit(expense)}>Edit</Button>
            <Button color="red" size="sm" onclick={() => onDelete(expense.id)}>Delete</Button>
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
