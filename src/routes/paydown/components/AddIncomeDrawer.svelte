<script lang="ts">
  import { Button, P, Drawer } from 'flowbite-svelte';
  import { addIncome, updateIncome, type MonthlyIncome } from '../helpers';

  let {
    open = $bindable(false),
    onSuccess = () => {},
    editingIncome = $bindable<MonthlyIncome | null>(null),
  } = $props();

  // Income form fields
  let incomeTitle = $state('');
  let incomeAmount = $state('');

  // Validation state
  let titleError = $state('');
  let amountError = $state('');

  // Check if we're in edit mode
  const isEditMode = $derived(editingIncome !== null);

  // Load data when editing
  $effect(() => {
    if (open && editingIncome) {
      incomeTitle = editingIncome.title;
      incomeAmount = editingIncome.amount.toString();
      titleError = '';
      amountError = '';
    } else if (open && !editingIncome) {
      // Reset form for add mode
      incomeTitle = '';
      incomeAmount = '';
      titleError = '';
      amountError = '';
    }
  });

  function validateForm(): boolean {
    titleError = '';
    amountError = '';

    if (!incomeTitle.trim()) {
      titleError = 'Title is required';
      return false;
    }

    const amount = parseFloat(incomeAmount);
    if (isNaN(amount) || amount < 0) {
      amountError = 'Amount must be a valid number greater than or equal to 0';
      return false;
    }

    return true;
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    const amount = parseFloat(incomeAmount) || 0;

    if (isEditMode && editingIncome) {
      // Update existing income
      updateIncome(editingIncome.id, {
        title: incomeTitle.trim(),
        amount: amount,
      });
    } else {
      // Add new income
      addIncome({
        title: incomeTitle.trim(),
        amount: amount,
      });
    }

    // Reset form
    incomeTitle = '';
    incomeAmount = '';
    editingIncome = null;
    titleError = '';
    amountError = '';

    // Close drawer
    open = false;

    // Notify parent to reload
    onSuccess();
  }

  function handleCancel() {
    incomeTitle = '';
    incomeAmount = '';
    editingIncome = null;
    titleError = '';
    amountError = '';
    open = false;
  }
</script>

<Drawer bind:open placement="right" class="z-50">
  <div class="flex max-h-[100vh] w-full max-w-md flex-col bg-white dark:bg-neutral-800">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
    >
      <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">
        {isEditMode ? 'Edit Income' : 'Add Income'}
      </P>
    </div>

    <!-- Form Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <form onsubmit={handleSubmit} class="flex flex-col gap-4">
        <div>
          <P size="sm" class="mb-2">Title</P>
          <input
            type="text"
            bind:value={incomeTitle}
            class="w-full rounded border px-3 py-2 text-neutral-900 {titleError
              ? 'border-red-500 dark:border-red-500'
              : 'border-neutral-300 dark:border-neutral-600'} dark:bg-neutral-800 dark:text-neutral-100"
            required
          />
          {#if titleError}
            <P size="xs" class="mt-1 text-red-600 dark:text-red-400">{titleError}</P>
          {/if}
        </div>
        <div>
          <P size="sm" class="mb-2">Monthly Amount</P>
          <input
            type="number"
            bind:value={incomeAmount}
            step="0.01"
            min="0"
            class="w-full rounded border px-3 py-2 text-neutral-900 {amountError
              ? 'border-red-500 dark:border-red-500'
              : 'border-neutral-300 dark:border-neutral-600'} dark:bg-neutral-800 dark:text-neutral-100"
            required
          />
          {#if amountError}
            <P size="xs" class="mt-1 text-red-600 dark:text-red-400">{amountError}</P>
          {/if}
        </div>
        <div class="flex gap-4 pt-4">
          <Button type="button" color="alternative" class="flex-1" onclick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" class="flex-1">{isEditMode ? 'Update' : 'Add Income'}</Button>
        </div>
      </form>
    </div>
  </div>
</Drawer>
