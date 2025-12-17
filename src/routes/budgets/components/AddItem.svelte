<script lang="ts">
  import { Button, Label, Datepicker } from 'flowbite-svelte';
  import Input from '$lib/components/Input.svelte';
  import Select from '$lib/components/Select.svelte';
  import {
    addBudgetItem,
    getBudget,
    getCategories,
    getBudgets,
    getCategoryPurchases,
  } from '$lib/api/budgets.remote';

  interface BudgetOption {
    value: string;
    name: string;
  }

  interface CategoryOption {
    value: string;
    name: string;
  }

  type Props = {
    budgetOptions: BudgetOption[];
    categoryOptions: CategoryOption[];
    selectedBudgetId?: string;
    onSuccess: () => void;
    onBudgetChange?: (budgetId: string) => void;
  };

  let {
    budgetOptions,
    categoryOptions,
    selectedBudgetId: initialBudgetId = '',
    onSuccess,
    onBudgetChange,
  }: Props = $props();

  let isSubmitting = $state(false);
  let itemBudgetId = $state(initialBudgetId);
  let itemCategoryId = $state('');
  let purchaseDate = $state<Date>(new Date());

  $effect(() => {
    if (initialBudgetId) {
      itemBudgetId = initialBudgetId;
    }
  });

  $effect(() => {
    // Explicitly track itemBudgetId to ensure effect runs when it changes
    const budgetId = itemBudgetId;

    if (budgetId && onBudgetChange) {
      onBudgetChange(budgetId);
    }
    if (budgetId) {
      itemCategoryId = '';
    }
  });
</script>

<form
  {...addBudgetItem.enhance(async ({ form, submit }) => {
    isSubmitting = true;
    try {
      await submit();

      if (addBudgetItem.result?.success === true) {
        form.reset();
        // Store budgetId and categoryId before resetting state
        const budgetIdToRefresh = itemBudgetId;
        const categoryIdToRefresh = itemCategoryId;

        // Refresh all related queries to update the UI
        if (budgetIdToRefresh) {
          const refreshPromises = [
            getBudgets().refresh(),
            getBudget(budgetIdToRefresh).refresh(),
            getCategories(budgetIdToRefresh).refresh(),
          ];

          // Also refresh category purchases if we have a categoryId
          // This ensures category-specific pages update
          if (categoryIdToRefresh) {
            refreshPromises.push(
              getCategoryPurchases({
                categoryId: categoryIdToRefresh,
                budgetId: budgetIdToRefresh,
              }).refresh(),
            );
          }

          await Promise.all(refreshPromises);
        }

        // Reset form state
        itemBudgetId = initialBudgetId;
        itemCategoryId = '';
        purchaseDate = new Date();
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      isSubmitting = false;
    }
  })}
  class="space-y-4"
>
  <input type="hidden" name="purchaseDate" value={purchaseDate.toISOString()} />
  <div>
    <Label for="item-name" class="mb-2 block">Purchase Name</Label>
    <Input
      field={addBudgetItem.fields.name}
      placeholder="e.g., Milk"
      disabled={isSubmitting}
      class="text-xl"
    />
  </div>
  <div>
    <Label for="item-date" class="mb-2 block">Date</Label>
    <Datepicker
      id="item-date"
      inputClass="text-xl h-12"
      color="primary"
      bind:value={purchaseDate}
      autohide
      disabled={isSubmitting}
    />
  </div>
  <div>
    <Label for="item-budget" class="mb-2 block">Budget</Label>
    <Select
      id="item-budget"
      name="budgetId"
      size="lg"
      classes={{ select: 'h-12 truncate text-xl' }}
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
      classes={{ select: 'h-12 truncate text-xl' }}
      items={categoryOptions}
      bind:value={itemCategoryId}
      disabled={!itemBudgetId || categoryOptions.length === 0 || isSubmitting}
      placeholder={!itemBudgetId ? 'Select a budget first' : 'Select a category'}
      required
    />
  </div>
  <div>
    <Label for="item-amount" class="mb-2 block">Amount ($)</Label>
    <Input
      field={addBudgetItem.fields.amount}
      type="number"
      step="0.01"
      min="0"
      placeholder="5.00"
      disabled={isSubmitting}
      class="text-xl"
    />
  </div>
  <Button type="submit" color="primary" class="w-full" disabled={isSubmitting}>
    Record Purchase
  </Button>
</form>
