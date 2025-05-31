<script lang="ts">
  import { enhance } from '$app/forms';
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import { Button, Datepicker, Input, Label, Select } from 'flowbite-svelte';
  type _Props = {
    budgets: BudgetWithRelations[];
    shouldHideBudgetSelect?: boolean;
  };

  let { budgets, shouldHideBudgetSelect = false }: _Props = $props();

  let selectedBudgetId = $state('');

  const budgetOptions = $derived(
    budgets.map((b) => ({
      value: b.uuid,
      name: b.name,
    })),
  );

  const categoryOptions = $derived(() => {
    if (!selectedBudgetId) return [];
    const budget = budgets.find((b) => b.uuid === selectedBudgetId);
    return (
      budget?.categories.map((c) => ({
        value: c.uuid,
        name: c.name,
      })) ?? []
    );
  });

  let selectedCategory = $state();
  let purchaseDate = $state<Date>(new Date());

  $effect(() => {
    if (selectedBudgetId) {
      selectedCategory = undefined;
    }
  });

  $effect(() => {
    if (budgets.length === 1) {
      selectedBudgetId = budgets[0].uuid;
    }
  });
</script>

<form
  action="/budgets?/addBudgetItem"
  method="post"
  use:enhance={({ formData }) => {
    formData.append('purchaseDate', purchaseDate.toISOString());
  }}
>
  <div class="flex flex-col justify-evenly gap-4 rounded-lg bg-neutral-200 p-4 dark:bg-neutral-800">
    <div class="flex w-full gap-4 overflow-visible">
      <div class="flex-1">
        <Label for="date" class="mb-2 block">Date</Label>
        <Datepicker autohide color="green" bind:value={purchaseDate} />
      </div>
      <div class="flex-1">
        <Label for="amount" class="mb-2 block">Amount</Label>
        <Input min={0} step="0.01" name="amount" placeholder="5.00" type="number" />
      </div>
    </div>
    <div class="flex w-full gap-4">
      <div class="flex-1">
        <Label for="name" class="mb-2 block">Name</Label>
        <Input name="name" placeholder="groceries" />
      </div>
      {#if !shouldHideBudgetSelect}
        <div class="flex-1">
          <Label for="category" class="mb-2 block">Budget</Label>
          <Select name="budgetId" items={budgetOptions} bind:value={selectedBudgetId} />
        </div>
      {:else}
        <input type="hidden" name="budgetId" value={selectedBudgetId} />
        <div class="flex-1">
          <Label for="category" class="mb-2 block">Category</Label>
          <Select
            name="categoryId"
            items={categoryOptions()}
            bind:value={selectedCategory}
            disabled={!selectedBudgetId || categoryOptions().length === 0}
            placeholder={!selectedBudgetId ? 'Select a budget first' : 'Select a category'}
          />
        </div>
      {/if}
    </div>
    {#if !shouldHideBudgetSelect}
      <div class="flex w-full gap-4">
        <div class="flex-1">
          <Label for="category" class="mb-2 block">Category</Label>
          <Select
            name="categoryId"
            items={categoryOptions()}
            bind:value={selectedCategory}
            disabled={!selectedBudgetId || categoryOptions().length === 0}
            placeholder={!selectedBudgetId ? 'Select a budget first' : 'Select a category'}
          />
        </div>
      </div>
    {/if}
    <Button type="submit" disabled={!selectedBudgetId || !selectedCategory || !purchaseDate}
      >Add new Purchase Item</Button
    >
  </div>
</form>
