<script lang="ts">
  import type { BudgetWithRelations, Category } from '$lib/server/db/schema';
  import { formatCurrency } from '$lib/utils/money';
  import { Button, Label, P } from 'flowbite-svelte';
  import { page } from '$app/state';
  import { CloseOutline, EditOutline } from 'flowbite-svelte-icons';
  import AddCategory from './AddCategory.svelte';
  import { getCategoryTotalSpent } from '$lib/helpers/budgets';

  type _Props = {
    budget: BudgetWithRelations;
    category: Category;
    shouldHideBudgetSelect?: boolean;
  };
  let { budget, category, shouldHideBudgetSelect = false }: _Props = $props();

  let isEdit = $state(false);
  const budgets = $derived(page.data.budgets);
  const totalSpent = $derived(getCategoryTotalSpent(category.uuid, budget.budgetItems));
  const containerClass = $derived(() => {
    return `dark:bg-sky-900 bg-sky-200 @container relative flex justify-evenly gap-2 rounded-lg ${isEdit ? 'p-0' : 'p-4'}`;
  });
  const remainingClass = $derived(() => {
    return category?.limit - totalSpent < 0
      ? 'text-red-500 dark:text-red-400'
      : '' + 'font-semibold';
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
    <AddCategory
      {budgets}
      {category}
      {isEdit}
      {shouldHideBudgetSelect}
      onSuccess={() => (isEdit = false)}
    />
  {:else}
    <div class="flex flex-1 flex-col gap-2 @sm:flex-row">
      <div class="flex flex-1 flex-col justify-evenly">
        <Label for="name">Name</Label>
        <P class="font-semibold">{category?.name}</P>
      </div>
      <div class="flex flex-1 flex-col justify-evenly">
        <Label for="limit">Limit</Label>
        <P class="font-semibold">{formatCurrency(category?.limit ?? 0)}</P>
      </div>
    </div>
    <div class="flex flex-1 flex-col gap-2 @sm:flex-row">
      <div class="flex flex-1 flex-col justify-evenly">
        <Label for="name">Total Spent</Label>
        <P class="font-semibold">{formatCurrency(totalSpent)}</P>
      </div>
      <div class="flex flex-1 flex-col justify-evenly">
        <Label for="remaining">Remaining</Label>
        <P class={remainingClass()}>{formatCurrency(category?.limit - totalSpent)}</P>
      </div>
    </div>
  {/if}
</div>
