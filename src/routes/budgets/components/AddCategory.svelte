<script lang="ts">
  import { Button, Label } from 'flowbite-svelte';
  import Input from '$lib/components/Input.svelte';
  import Select from '$lib/components/Select.svelte';
  import { addCategory, getBudget, getBudgets, getCategories } from '$lib/api/budgets.remote';

  interface BudgetOption {
    value: string;
    name: string;
  }

  type Props = {
    budgetOptions?: BudgetOption[];
    selectedBudgetId?: string;
    hideBudgetSelect?: boolean;
    onSuccess: () => void;
    onCancel?: () => void;
  };

  let {
    budgetOptions = [],
    selectedBudgetId: initialBudgetId = '',
    hideBudgetSelect = false,
    onSuccess,
    onCancel,
  }: Props = $props();

  let isSubmitting = $state(false);
  let selectedBudgetId = $state(initialBudgetId);

  $effect(() => {
    if (initialBudgetId) {
      selectedBudgetId = initialBudgetId;
    }
  });
</script>

<form
  {...addCategory.enhance(async ({ form, submit }) => {
    isSubmitting = true;
    try {
      await submit();

      if (addCategory.result?.success === true) {
        form.reset();
        // Get budgetId from the result (more reliable than state)
        const budgetIdToRefresh = addCategory.result?.budgetId || selectedBudgetId;

        // Refresh all related queries to update the UI
        if (budgetIdToRefresh) {
          const refreshPromises = [
            getBudgets().refresh(),
            getBudget(budgetIdToRefresh).refresh(),
            getCategories(budgetIdToRefresh).refresh(),
          ];

          await Promise.all(refreshPromises);
        }

        // Reset form state
        selectedBudgetId = initialBudgetId;
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
  <div>
    <Label for="category-name" class="mb-2 block">Category Name</Label>
    <Input
      field={addCategory.fields.name}
      placeholder="e.g., Food"
      disabled={isSubmitting}
      class="text-xl"
    />
  </div>
  {#if !hideBudgetSelect}
    <div>
      <Label for="category-budget" class="mb-2 block">Budget</Label>
      <Select
        id="category-budget"
        name="budgetId"
        size="lg"
        classes={{ select: 'h-12 truncate text-xl' }}
        items={budgetOptions}
        bind:value={selectedBudgetId}
        disabled={isSubmitting}
        required
      />
    </div>
  {:else}
    <input type="hidden" name="budgetId" value={selectedBudgetId} />
  {/if}
  <div>
    <Label for="category-limit" class="mb-2 block">Monthly Limit ($)</Label>
    <Input
      field={addCategory.fields.limit}
      type="number"
      step="0.01"
      min="0"
      placeholder="500.00"
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
      Create Category
    </Button>
  </div>
</form>
