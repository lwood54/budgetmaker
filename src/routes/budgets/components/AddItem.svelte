<script lang="ts">
  import { Button, Label, Datepicker } from 'flowbite-svelte';
  import Input from '$lib/components/Input.svelte';
  import SelectWithSearch from '$lib/components/SelectWithSearch.svelte';
  import {
    addBudgetItem,
    getBudget,
    getCategories,
    getBudgets,
    getCategoryPurchases,
  } from '$lib/api/budgets.remote';

  const addItemFormInstanceId = $props.id();

  interface BudgetOption {
    value: string;
    name: string;
  }

  interface CategoryOption {
    value: string;
    name: string;
  }

  type Props = {
    budgetOptions?: BudgetOption[];
    categoryOptions: CategoryOption[];
    selectedBudgetId?: string;
    hideBudgetSelect?: boolean;
    onSuccess: () => void;
    onCancel?: () => void;
    onBudgetChange?: (budgetId: string) => void;
  };

  let {
    budgetOptions = [],
    categoryOptions,
    selectedBudgetId: initialBudgetId = '',
    hideBudgetSelect = false,
    onSuccess,
    onCancel,
    onBudgetChange,
  }: Props = $props();

  // Isolated remote form per component instance so values don't persist after leaving the page
  const addItemForm = addBudgetItem.for(addItemFormInstanceId);

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
  {...addItemForm.enhance(async ({ form, submit }) => {
    isSubmitting = true;
    try {
      await submit();

      if (addItemForm.result?.success === true) {
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
      field={addItemForm.fields.name}
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
  {#if !hideBudgetSelect}
    <div>
      <Label for="item-budget" class="mb-2 block">Budget</Label>
      <SelectWithSearch
        id="item-budget"
        name="budgetId"
        size="lg"
        class="[&>button]:truncate [&>button]:text-xl"
        items={budgetOptions}
        bind:value={itemBudgetId}
        disabled={isSubmitting}
        searchPlaceholder="Search budgets..."
        required
      />
    </div>
  {:else}
    <input type="hidden" name="budgetId" value={itemBudgetId} />
  {/if}
  <div>
    <Label for="item-category" class="mb-2 block">Category</Label>
    <SelectWithSearch
      id="item-category"
      name="categoryId"
      field={addItemForm.fields.categoryId}
      size="lg"
      class="[&>button]:truncate [&>button]:text-xl"
      items={categoryOptions}
      bind:value={itemCategoryId}
      disabled={!itemBudgetId || categoryOptions.length === 0 || isSubmitting}
      placeholder={!itemBudgetId ? 'Select a budget first' : 'Select a category'}
      searchPlaceholder="Search categories..."
      required
    />
  </div>
  <div>
    <Label for="item-amount" class="mb-2 block">Amount ($)</Label>
    <Input
      field={addItemForm.fields.amount}
      type="number"
      step="0.01"
      placeholder="38.00 or -12.98"
      disabled={isSubmitting}
      class="text-xl"
    />
  </div>
  <div class="flex gap-3">
    {#if onCancel}
      <Button
        type="button"
        color="alternative"
        class="flex-1"
        disabled={isSubmitting}
        onclick={onCancel}
      >
        Cancel
      </Button>
    {/if}
    <Button
      type="submit"
      color="primary"
      class={onCancel ? 'flex-1' : 'w-full'}
      disabled={isSubmitting}
    >
      Record Purchase
    </Button>
  </div>
</form>
