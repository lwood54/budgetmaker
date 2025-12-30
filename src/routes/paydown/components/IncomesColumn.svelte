<script lang="ts">
  import { Button, P } from 'flowbite-svelte';

  let { incomes = $bindable([]), onAddClick = () => {}, onDelete = () => {} } = $props();
</script>

<div class="flex flex-1 flex-col gap-4">
  <div class="flex items-center justify-between">
    <P size="lg">Monthly Incomes</P>
    <Button size="sm" onclick={() => onAddClick()}>Add Income</Button>
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
          <Button color="red" size="sm" onclick={() => onDelete(income.id)}>Delete</Button>
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
