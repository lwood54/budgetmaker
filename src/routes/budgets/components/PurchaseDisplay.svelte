<script lang="ts">
  import type { BudgetItem, BudgetWithRelations } from '$lib/server/db/schema';
  import { formatCurrency } from '$lib/utils/money';
  import { Button, Label, P } from 'flowbite-svelte';
  import AddBudgetItem from './AddBudgetItem.svelte';
  import { page } from '$app/state';
  import { CloseOutline, EditOutline } from 'flowbite-svelte-icons';

  type _Props = {
    budget: BudgetWithRelations;
    budgetItem: BudgetItem;
  };
  let { budget, budgetItem }: _Props = $props();
  const category = $derived(() => {
    return budget.categories.find((c) => c.uuid === budgetItem.categoryId);
  });
  let isEdit = $state(false);
  const budgets = $derived(page.data.budgets);
  const containerClass = $derived(() => {
    // return `dark:bg-primary-900 bg-primary-200 @container relative flex justify-evenly gap-2 rounded-lg ${isEdit ? 'p-0' : 'p-4'}`;
    return `dark:bg-primary-900 bg-primary-200 @container relative flex justify-evenly gap-2`;
  });
</script>

<div class={containerClass()}>
  <div class="absolute top-0 right-0 m-2">
    <Button
      pill={true}
      color="gray"
      size="sm"
      class="h-6 w-6 rounded-full p-4"
      onclick={() => (isEdit = !isEdit)}
    >
      {#if isEdit}
        <CloseOutline class="text-primary-900 dark:text-primary-200" size="sm" />
      {:else}
        <EditOutline size="sm" />
      {/if}
    </Button>
  </div>
  {#if isEdit && budgets}
    <AddBudgetItem
      {budgets}
      {budgetItem}
      {isEdit}
      onSuccess={() => {
        isEdit = false;
      }}
    />
  {:else}
    <div class="flex flex-1 flex-col gap-2 @sm:flex-row">
      <div class="flex flex-1 flex-col justify-evenly">
        <Label for="name">Name</Label>
        <P class="font-semibold">{budgetItem.name}</P>
      </div>
      <div class="flex flex-1 flex-col justify-evenly">
        <Label for="date">Date</Label>
        <P class="font-semibold">{new Date(budgetItem.purchaseDate).toLocaleDateString()}</P>
      </div>
    </div>
    <div class="flex flex-1 flex-col gap-2 @sm:flex-row">
      <div class="flex flex-1 flex-col justify-evenly">
        <Label for="amount">Amount</Label>
        <P class="font-semibold">{formatCurrency(budgetItem.amount)}</P>
      </div>
      <div class="flex flex-1 flex-col justify-evenly">
        <Label for="category">Category</Label>
        <P class="font-semibold">{category()?.name}</P>
      </div>
    </div>
  {/if}
</div>
