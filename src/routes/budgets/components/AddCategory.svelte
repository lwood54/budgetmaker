<script lang="ts">
  import { enhance } from '$app/forms';
  import type { BudgetWithRelations, Category } from '$lib/server/db/schema';
  import { Button, Input, Label, Select } from 'flowbite-svelte';

  type _Props = {
    budgets?: BudgetWithRelations[];
    category?: Category;
    isEdit?: boolean;
    onSuccess?: () => void;
    shouldHideBudgetSelect?: boolean;
  };
  let {
    budgets = [],
    category,
    isEdit = false,
    onSuccess,
    shouldHideBudgetSelect = false,
  }: _Props = $props();
  let selectedBudgetId = $state('');
  let name = $state('');
  let limit = $state(0);
  let isSubmitting = $state(false);

  const budgetOptions = $derived(
    budgets?.map((b) => ({
      value: b.uuid,
      name: b.name,
    })),
  );

  const containerClass = $derived(() => {
    return `flex flex-col justify-evenly gap-4 rounded-lg ${isEdit ? 'bg-neutral-300 dark:bg-neutral-600' : 'bg-neutral-200 dark:bg-neutral-800'} p-4`;
  });

  const formAction = isEdit
    ? `/budgets?/editCategory&categoryUUID=${category?.uuid}`
    : '/budgets?/addCategory';

  $effect(() => {
    if (budgets.length === 1) {
      selectedBudgetId = budgets[0].uuid;
    }
  });

  $effect(() => {
    if (category) {
      selectedBudgetId = category.budgetId;
      name = category.name;
      limit = category.limit / 100;
    }
  });
</script>

<div class="w-full">
  <form
    action={formAction}
    method="post"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ result, update }) => {
        await update();
        isSubmitting = false;
        if (result.status?.toString().startsWith('2')) {
          onSuccess?.();
        }
      };
    }}
  >
    <div class={containerClass()}>
      <div>
        <Label for="name" class="mb-2 block">Name</Label>
        <Input name="name" placeholder="groceries" bind:value={name} class="text-lg" />
      </div>
      <div>
        <Label for="limit" class="mb-2 block">Limit</Label>
        <Input
          min={0}
          step="0.01"
          name="limit"
          placeholder="500.00"
          type="number"
          bind:value={limit}
          class="text-lg"
        />
      </div>
      {#if !shouldHideBudgetSelect}
        <div>
          <Label for="budgetId" class="mb-2 block">Budget</Label>
          <Select
            size="lg"
            selectClass="h-12"
            name="budgetId"
            items={budgetOptions}
            bind:value={selectedBudgetId}
          />
        </div>
      {:else}
        <input type="hidden" name="budgetId" value={selectedBudgetId} />
      {/if}
      <Button type="submit" disabled={isSubmitting}>
        {#if isEdit}
          Update Category
        {:else}
          Create Category
        {/if}
      </Button>
    </div>
  </form>
</div>
