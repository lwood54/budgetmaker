<script lang="ts">
  import { enhance } from '$app/forms';
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import { Button, Input, Label, TabItem, Tabs } from 'flowbite-svelte';
  import AddCategory from './AddCategory.svelte';
  import AddBudgetItem from './AddBudgetItem.svelte';

  type _Props = {
    budgets: BudgetWithRelations[];
  };
  let { budgets }: _Props = $props();
</script>

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
    <AddCategory {budgets} />
  </TabItem>
  <TabItem title="Record Purchase">
    <AddBudgetItem {budgets} />
  </TabItem>
</Tabs>
