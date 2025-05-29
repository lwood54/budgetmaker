<script lang="ts">
  import { enhance } from '$app/forms';
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import { Button, Datepicker, Input, Label, Select, TabItem, Tabs } from 'flowbite-svelte';

  type _Props = {
    budgets: BudgetWithRelations[];
  };
  let { budgets }: _Props = $props();

  const budgetOptions = $derived(
    budgets.map((b) => ({
      value: b.uuid,
      name: b.name,
    })),
  );

  let selectedBudget = $state();

  const categoryOptions = $derived(() => {
    if (!selectedBudget) return [];
    const budget = budgets.find((b) => b.uuid === selectedBudget);
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
    if (selectedBudget) {
      selectedCategory = undefined;
    }
  });

  $inspect(selectedBudget);
</script>

<!-- <div class="flex-1"> -->
<Tabs>
  <TabItem open title="Add Budget">
    <form action="?/addBudget" method="post" use:enhance>
      <div
        class="flex flex-col justify-evenly gap-4 rounded-lg bg-neutral-200 p-4 dark:bg-neutral-800"
      >
        <div>
          <Label for="name" class="mb-2 block">Name</Label>
          <Input name="name" placeholder="groceries" />
        </div>
        <Button type="submit">Create Budget</Button>
      </div>
    </form>
  </TabItem>
  <TabItem title="Add Category">
    <form action="?/addCategory" method="post" use:enhance>
      <div
        class="flex flex-col justify-evenly gap-4 rounded-lg bg-neutral-200 p-4 dark:bg-neutral-800"
      >
        <div>
          <Label for="name" class="mb-2 block">Name</Label>
          <Input name="name" placeholder="groceries" />
        </div>
        <div>
          <Label for="limit" class="mb-2 block">Limit</Label>
          <Input min={0} name="limit" placeholder="500" type="number" />
        </div>
        <div>
          <Label for="budgetId" class="mb-2 block">Budget</Label>
          <Select name="budgetId" items={budgetOptions} bind:value={selectedBudget} />
        </div>
        <Button type="submit">Create Category</Button>
      </div>
    </form>
  </TabItem>
  <TabItem title="Log Purchase Item">
    <form
      action="?/addBudgetItem"
      method="post"
      use:enhance={({ formData }) => {
        formData.append('purchaseDate', purchaseDate.toISOString());
      }}
    >
      <div
        class="flex flex-col justify-evenly gap-4 rounded-lg bg-neutral-200 p-4 dark:bg-neutral-800"
      >
        <div class="flex w-full gap-4 overflow-visible">
          <div class="flex-1">
            <Label for="date" class="mb-2 block">Date</Label>
            <Datepicker autohide color="green" bind:value={purchaseDate} />
          </div>
          <div class="flex-1">
            <Label for="amount" class="mb-2 block">Amount</Label>
            <Input min={0} name="amount" placeholder="500" type="number" />
          </div>
        </div>
        <div class="flex w-full gap-4">
          <div class="flex-1">
            <Label for="name" class="mb-2 block">Name</Label>
            <Input name="name" placeholder="groceries" />
          </div>
          <div class="flex-1">
            <Label for="category" class="mb-2 block">Budget</Label>
            <Select name="budgetId" items={budgetOptions} bind:value={selectedBudget} />
          </div>
        </div>
        <div class="flex w-full gap-4">
          <div class="flex-1">
            <Label for="category" class="mb-2 block">Category</Label>
            <Select
              name="categoryId"
              items={categoryOptions()}
              bind:value={selectedCategory}
              disabled={!selectedBudget || categoryOptions().length === 0}
              placeholder={!selectedBudget ? 'Select a budget first' : 'Select a category'}
            />
          </div>
        </div>
        <Button type="submit" disabled={!selectedBudget || !selectedCategory || !purchaseDate}
          >Add new Purchase Item</Button
        >
      </div>
    </form>
  </TabItem>
</Tabs>
