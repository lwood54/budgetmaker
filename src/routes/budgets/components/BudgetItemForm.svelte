<script lang="ts">
  import { enhance } from '$app/forms';
  import type { BudgetItem, BudgetWithRelations } from '$lib/server/db/schema';
  import { Button, Datepicker, Input, Select, Spinner, TableBodyCell } from 'flowbite-svelte';
  import { CloseOutline, FloppyDiskOutline } from 'flowbite-svelte-icons';

  type _Props = {
    budgets: BudgetWithRelations[];
    budgetItem?: BudgetItem;
    onSuccess?: () => void;
  };

  let { budgets, budgetItem, onSuccess }: _Props = $props();

  let selectedBudgetId = $state('');
  let name = $state('');
  let amount = $state(0);
  let isSubmitting = $state(false);
  const isEdit = $derived(Boolean(budgetItem));

  const formAction = $derived(() => {
    return isEdit
      ? `/budgets?/editBudgetItem&budgetItemUUID=${budgetItem?.uuid}`
      : '/budgets?/addBudgetItem';
  });


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

  let selectedCategoryId = $state('');
  let purchaseDate = $state<Date>(new Date());
  let notReady = $derived(
    !selectedBudgetId || !selectedCategoryId || !purchaseDate || !name || !amount,
  );
  const buttonClass = $derived(() => {
    return `h-6 w-6 p-4 ${notReady ? '!cursor-not-allowed !opacity-50' : ''} border-none`;
  });

  $effect(() => {
    if (selectedBudgetId && !isEdit) {
      selectedCategoryId = '';
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

<TableBodyCell>
  <Input name="name" placeholder="groceries" bind:value={name} class="text-lg" />
</TableBodyCell>
<TableBodyCell>
  <Datepicker
    inputClass="text-lg"
    id="date-picker-input"
    color="green"
    bind:value={purchaseDate}
    autohide
  />
</TableBodyCell>
<TableBodyCell>
  <Select
    size="lg"
    selectClass="h-12"
    name="categoryId"
    items={categoryOptions()}
    bind:value={selectedCategoryId}
    disabled={!selectedBudgetId || categoryOptions().length === 0}
    placeholder={!selectedBudgetId ? 'Select a budget first' : 'Select a category'}
  />
</TableBodyCell>
<TableBodyCell>
  <Input
    min={0}
    step="0.01"
    name="amount"
    placeholder="5.00"
    type="number"
    bind:value={amount}
    class="text-lg"
  />
</TableBodyCell>

<TableBodyCell>
  <form
    action={formAction()}
    method="post"
    use:enhance={({ formData }) => {
      formData.append('purchaseDate', purchaseDate.toISOString());
      formData.append('budgetId', selectedBudgetId);
      formData.append('categoryId', selectedCategoryId);
      formData.append('name', name);
      formData.append('amount', amount.toString());

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
    <div class="flex w-18 justify-center gap-2">
      <Button
        type="submit"
        disabled={notReady || isSubmitting}
        pill
        outline
        size="sm"
        class={buttonClass()}
      >
        {#if isSubmitting}
          <Spinner />
        {:else}
          <FloppyDiskOutline color="currentColor" size="md" />
        {/if}
      </Button>
      <Button onclick={() => onSuccess?.()} pill outline size="sm" class="h-6 w-6 border-none p-4">
        <CloseOutline color="currentColor" size="md" />
      </Button>
    </div>
  </form>
</TableBodyCell>
