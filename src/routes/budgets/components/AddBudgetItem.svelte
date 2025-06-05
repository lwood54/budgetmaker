<script lang="ts">
  import { enhance } from '$app/forms';
  import type { BudgetItem, BudgetWithRelations } from '$lib/server/db/schema';
  import { Button, Datepicker, Input, Label, Select, Spinner } from 'flowbite-svelte';

  type _Props = {
    budgets: BudgetWithRelations[];
    budgetItem?: BudgetItem;
    isEdit?: boolean;
    onSuccess?: () => void;
    shouldHideBudgetSelect?: boolean;
  };

  let {
    budgets,
    budgetItem,
    isEdit = false,
    onSuccess,
    shouldHideBudgetSelect = false,
  }: _Props = $props();

  let selectedBudgetId = $state('');
  let name = $state('');
  let amount = $state(0);
  let isSubmitting = $state(false);

  const formAction = isEdit
    ? `/budgets?/editBudgetItem&budgetItemUUID=${budgetItem?.uuid}`
    : '/budgets?/addBudgetItem';

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

  const containerClass = $derived(() => {
    return `flex flex-col justify-evenly gap-4 rounded-lg ${isEdit ? 'bg-neutral-300 dark:bg-neutral-600' : 'bg-neutral-200 dark:bg-neutral-800'} p-4`;
  });

  let selectedCategoryId = $state();
  let purchaseDate = $state<Date>(new Date());

  $effect(() => {
    if (selectedBudgetId && !isEdit) {
      selectedCategoryId = undefined;
    }
  });

  $effect(() => {
    if (budgets.length === 1) {
      selectedBudgetId = budgets[0].uuid;
    }
  });

  $effect(() => {
    if (budgetItem) {
      selectedBudgetId = budgetItem.budgetId;
      selectedCategoryId = budgetItem.categoryId;
      purchaseDate = new Date(budgetItem.purchaseDate);
      name = budgetItem.name;
      amount = budgetItem.amount / 100;
    }
  });
</script>

<div class="w-full">
  <form
    action={formAction}
    method="post"
    use:enhance={({ formData, submitter }) => {
      /*
      NOTE: Datepicker has an internal button with type="submit" which triggers form submission
      so we need to prevent this by ensuring the submission trigger happens from the submit
      button we intend.
    */
      const submitterElement = submitter as HTMLElement;
      const isOurButton = submitterElement?.id === 'submit-button';
      if (!isOurButton) {
        return () => {};
      }

      formData.append('purchaseDate', purchaseDate.toISOString());
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
      <div class="flex w-full gap-4 overflow-visible">
        <div class="flex-1">
          <Label for="name" class="mb-2 block">Name</Label>
          <Input name="name" placeholder="groceries" bind:value={name} />
        </div>
        <div class="flex-1">
          <Label for="amount" class="mb-2 block">Amount</Label>
          <Input
            min={0}
            step="0.01"
            name="amount"
            placeholder="5.00"
            type="number"
            bind:value={amount}
          />
        </div>
      </div>
      <div class="flex w-full gap-4">
        <div class="flex-1">
          <Label for="date" class="mb-2 block">Date</Label>
          <Datepicker id="date-picker-input" color="green" bind:value={purchaseDate} autohide />
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
              bind:value={selectedCategoryId}
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
              bind:value={selectedCategoryId}
              disabled={!selectedBudgetId || categoryOptions().length === 0}
              placeholder={!selectedBudgetId ? 'Select a budget first' : 'Select a category'}
            />
          </div>
        </div>
      {/if}
      <Button
        id="submit-button"
        type="submit"
        disabled={!selectedBudgetId || !selectedCategoryId || !purchaseDate || isSubmitting}
      >
        {#if isSubmitting}
          <Spinner />
        {:else if isEdit}
          Update Purchase Item
        {:else}
          Record Purchase
        {/if}
      </Button>
    </div>
  </form>
</div>
