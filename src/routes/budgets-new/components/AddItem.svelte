<script lang="ts">
  import { Button, Input, Label, Select, Datepicker, P } from 'flowbite-svelte';
  import { addBudgetItem } from '$lib/api/budgets.remote';
  import { enhance } from '$app/forms';

  interface BudgetOption {
    value: string;
    name: string;
  }

  interface CategoryOption {
    value: string;
    name: string;
  }

  interface Props {
    isSubmitting: boolean;
    formError: string;
    budgetOptions: BudgetOption[];
    categoryOptions: CategoryOption[];
    selectedBudgetId?: string;
    onSubmittingChange: (value: boolean) => void;
    onErrorChange: (value: string) => void;
    onSuccess: () => void;
    onBudgetChange?: (budgetId: string) => void;
  }

  let {
    isSubmitting,
    formError,
    budgetOptions,
    categoryOptions,
    selectedBudgetId: initialBudgetId = '',
    onSubmittingChange,
    onErrorChange,
    onSuccess,
    onBudgetChange,
  }: Props = $props();

  let itemName = $state('');
  let itemAmount = $state<number>(0);
  let itemBudgetId = $state(initialBudgetId);
  let itemCategoryId = $state('');
  let purchaseDate = $state<Date>(new Date());

  $effect(() => {
    if (initialBudgetId) {
      itemBudgetId = initialBudgetId;
    }
  });

  $effect(() => {
    if (itemBudgetId && onBudgetChange) {
      onBudgetChange(itemBudgetId);
    }
    if (itemBudgetId) {
      itemCategoryId = '';
    }
  });
</script>

<form
  {...addBudgetItem}
  use:enhance={({ formData }) => {
    // Add purchaseDate from the datepicker
    formData.append('purchaseDate', purchaseDate.toISOString());
    onSubmittingChange(true);
    onErrorChange('');
    return async ({ result, update: _update }) => {
      onSubmittingChange(false);
      if (result.type === 'success') {
        itemName = '';
        itemAmount = 0;
        itemBudgetId = '';
        itemCategoryId = '';
        purchaseDate = new Date();
        onSuccess();
      } else if (result.type === 'failure') {
        const errorData = result.data as { error?: { message?: string } } | undefined;
        onErrorChange(errorData?.error?.message || 'Failed to add purchase');
      } else if (result.type === 'error') {
        onErrorChange(result.error?.message || 'Failed to add purchase');
      }
      // Don't call update() - we're handling refresh manually via budgetsQuery.refresh()
    };
  }}
  class="space-y-4"
>
  <div>
    <Label for="item-name" class="mb-2 block">Purchase Name</Label>
    <Input
      id="item-name"
      name="name"
      placeholder="e.g., Milk"
      bind:value={itemName}
      disabled={isSubmitting}
      class="text-lg"
      required
    />
  </div>
  <div class="grid grid-cols-2 gap-4">
    <div>
      <Label for="item-amount" class="mb-2 block">Amount ($)</Label>
      <Input
        id="item-amount"
        name="amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="5.00"
        bind:value={itemAmount}
        disabled={isSubmitting}
        class="text-lg"
        required
      />
    </div>
    <div>
      <Label for="item-date" class="mb-2 block">Date</Label>
      <Datepicker
        id="item-date"
        inputClass="text-lg h-12"
        color="primary"
        bind:value={purchaseDate}
        autohide
        disabled={isSubmitting}
      />
    </div>
  </div>
  <div>
    <Label for="item-budget" class="mb-2 block">Budget</Label>
    <Select
      id="item-budget"
      name="budgetId"
      size="lg"
      selectClass="h-12"
      items={budgetOptions}
      bind:value={itemBudgetId}
      disabled={isSubmitting}
      required
    />
  </div>
  <div>
    <Label for="item-category" class="mb-2 block">Category</Label>
    <Select
      id="item-category"
      name="categoryId"
      size="lg"
      selectClass="h-12"
      items={categoryOptions}
      bind:value={itemCategoryId}
      disabled={!itemBudgetId || categoryOptions.length === 0 || isSubmitting}
      placeholder={!itemBudgetId ? 'Select a budget first' : 'Select a category'}
      required
    />
  </div>
  {#if formError}
    <P size="sm" class="text-red-600 dark:text-red-400">{formError}</P>
  {/if}
  <Button type="submit" color="primary" class="w-full" disabled={isSubmitting}>
    Record Purchase
  </Button>
</form>
