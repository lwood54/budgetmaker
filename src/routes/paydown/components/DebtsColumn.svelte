<script lang="ts">
  import { Button, P } from 'flowbite-svelte';
  import { sortDebtsByPriority, type PaydownDebt } from '../helpers';

  let {
    debts = $bindable([]),
    onAddClick = () => {},
    onDelete = () => {},
    onEdit = () => {},
  } = $props();
</script>

<div class="flex flex-1 flex-col gap-4">
  <div class="flex items-center justify-between">
    <P size="lg">Paydown Debts</P>
    <Button size="sm" onclick={() => onAddClick()}>Add Debt</Button>
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
          <div class="flex gap-2">
            <Button size="sm" onclick={() => onEdit(debt)}>Edit</Button>
            <Button color="red" size="sm" onclick={() => onDelete(debt.id)}>Delete</Button>
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
