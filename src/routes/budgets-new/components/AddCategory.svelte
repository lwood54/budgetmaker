<script lang="ts">
  import { Button, Input, Label, Select, P } from 'flowbite-svelte';
  import { addCategory } from '$lib/api/budgets.remote';
  import { enhance } from '$app/forms';

  interface BudgetOption {
    value: string;
    name: string;
  }

  interface Props {
    isSubmitting: boolean;
    formError: string;
    budgetOptions: BudgetOption[];
    selectedBudgetId?: string;
    onSubmittingChange: (value: boolean) => void;
    onErrorChange: (value: string) => void;
    onSuccess: () => void;
  }

  let {
    isSubmitting,
    formError,
    budgetOptions,
    selectedBudgetId: initialBudgetId = '',
    onSubmittingChange,
    onErrorChange,
    onSuccess,
  }: Props = $props();

  let categoryName = $state('');
  let categoryLimit = $state<number>(0);
  let selectedBudgetId = $state(initialBudgetId);

  $effect(() => {
    if (initialBudgetId) {
      selectedBudgetId = initialBudgetId;
    }
  });
</script>

<form
  {...addCategory}
  use:enhance={() => {
    onSubmittingChange(true);
    onErrorChange('');
    return async ({ result, update: _update }) => {
      onSubmittingChange(false);
      if (result.type === 'success') {
        categoryName = '';
        categoryLimit = 0;
        selectedBudgetId = '';
        onSuccess();
      } else if (result.type === 'failure') {
        const errorData = result.data as { error?: { message?: string } } | undefined;
        onErrorChange(errorData?.error?.message || 'Failed to create category');
      } else if (result.type === 'error') {
        onErrorChange(result.error?.message || 'Failed to create category');
      }
      // Don't call update() - we're handling refresh manually via budgetsQuery.refresh()
    };
  }}
  class="space-y-4"
>
  <div>
    <Label for="category-name" class="mb-2 block">Category Name</Label>
    <Input
      id="category-name"
      name="name"
      placeholder="e.g., Food"
      bind:value={categoryName}
      disabled={isSubmitting}
      class="text-lg"
      required
    />
  </div>
  <div>
    <Label for="category-limit" class="mb-2 block">Monthly Limit ($)</Label>
    <Input
      id="category-limit"
      name="limit"
      type="number"
      step="0.01"
      min="0"
      placeholder="500.00"
      bind:value={categoryLimit}
      disabled={isSubmitting}
      class="text-lg"
      required
    />
  </div>
  <div>
    <Label for="category-budget" class="mb-2 block">Budget</Label>
    <Select
      id="category-budget"
      name="budgetId"
      size="lg"
      selectClass="h-12"
      items={budgetOptions}
      bind:value={selectedBudgetId}
      disabled={isSubmitting}
      required
    />
  </div>
  {#if formError}
    <P size="sm" class="text-red-600 dark:text-red-400">{formError}</P>
  {/if}
  <Button type="submit" color="primary" class="w-full" disabled={isSubmitting}>
    Create Category
  </Button>
</form>
