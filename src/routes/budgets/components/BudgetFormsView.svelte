<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Budget } from '$lib/server/db/schema';
  import { Button, Datepicker, Input, Label, Select, TabItem, Tabs } from 'flowbite-svelte';

  type _Props = {
    budgets: Budget[];
  };
  let { budgets, form, categories }: _Props = $props();

  const fakeCategories: { name: string; uuid: string; limit: number; budgetId: string }[] = [
    {
      name: 'groceries',
      uuid: crypto.randomUUID(),
      limit: 1200,
      budgetId: budgets[0].uuid,
    },
    {
      name: 'gas',
      uuid: crypto.randomUUID(),
      limit: 450,
      budgetId: budgets[0].uuid,
    },
    {
      name: 'household fixed',
      uuid: crypto.randomUUID(),
      limit: 1500,
      budgetId: budgets[1].uuid,
    },
    {
      name: 'restaurants',
      uuid: crypto.randomUUID(),
      limit: 250,
      budgetId: budgets[1].uuid,
    },
    {
      name: 'entertainment',
      uuid: crypto.randomUUID(),
      limit: 400,
      budgetId: budgets[2].uuid,
    },
  ];

  const budgetOptions = $derived(
    budgets.map((b) => ({
      value: b.uuid,
      name: b.name,
    })),
  );
  let selectedBudget = $state();
  const categoryOptions = $derived(
    fakeCategories
      .filter((c) => c.budgetId === selectedBudget)
      .map((c) => ({
        value: c.uuid,
        name: c.name,
      })),
  );
  let selectedCategory = $state();

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
    <div
      class="flex flex-col justify-evenly gap-4 rounded-lg bg-neutral-200 p-4 dark:bg-neutral-800"
    >
      <div class="flex w-full gap-4 overflow-visible">
        <div class="flex-1">
          <Label for="date" class="mb-2 block">Date</Label>
          <Datepicker autohide color="green" />
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
          <Select items={budgetOptions} bind:value={selectedBudget} />
        </div>
      </div>
      <div class="flex w-full gap-4">
        <div class="flex-1">
          <Label for="category" class="mb-2 block">Category</Label>
          <Select items={categoryOptions} bind:value={selectedCategory} />
        </div>
      </div>
      <Button>Add new Purchase Item</Button>
    </div>
  </TabItem>
</Tabs>
