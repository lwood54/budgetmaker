<script lang="ts">
  import { enhance } from '$app/forms';
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import { Button, Input, Label, Select } from 'flowbite-svelte';

  type _Props = {
    budgets?: BudgetWithRelations[];
    shouldHideBudgetSelect?: boolean;
  };
  let { budgets = [], shouldHideBudgetSelect = false }: _Props = $props();
  let selectedBudgetId = $state('');
  const budgetOptions = $derived(
    budgets?.map((b) => ({
      value: b.uuid,
      name: b.name,
    })),
  );

  $effect(() => {
    if (budgets.length === 1) {
      selectedBudgetId = budgets[0].uuid;
    }
  });
</script>

<form action="/budgets?/addCategory" method="post" use:enhance>
  <div class="flex flex-col justify-evenly gap-4 rounded-lg bg-neutral-200 p-4 dark:bg-neutral-800">
    <div>
      <Label for="name" class="mb-2 block">Name</Label>
      <Input name="name" placeholder="groceries" />
    </div>
    <div>
      <Label for="limit" class="mb-2 block">Limit</Label>
      <Input min={0} step="0.01" name="limit" placeholder="500.00" type="number" />
    </div>
    {#if !shouldHideBudgetSelect}
      <div>
        <Label for="budgetId" class="mb-2 block">Budget</Label>
        <Select name="budgetId" items={budgetOptions} bind:value={selectedBudgetId} />
      </div>
    {:else}
      <input type="hidden" name="budgetId" value={selectedBudgetId} />
    {/if}
    <Button type="submit">Create Category</Button>
  </div>
</form>
