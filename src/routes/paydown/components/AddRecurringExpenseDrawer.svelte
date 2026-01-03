<script lang="ts">
  import { Button, P, Drawer } from 'flowbite-svelte';
  import { addRecurringExpense, updateRecurringExpense, type RecurringExpense } from '../helpers';

  let {
    open = $bindable(false),
    onSuccess = () => {},
    editingExpense = $bindable<RecurringExpense | null>(null),
  } = $props();

  // Recurring expense form fields
  let expenseTitle = $state('');
  let expenseAmount = $state('');

  // Validation state
  let titleError = $state('');
  let amountError = $state('');

  // Check if we're in edit mode
  const isEditMode = $derived(editingExpense !== null);

  // Load data when editing
  $effect(() => {
    if (open && editingExpense) {
      expenseTitle = editingExpense.title;
      expenseAmount = editingExpense.amount.toString();
      titleError = '';
      amountError = '';
    } else if (open && !editingExpense) {
      // Reset form for add mode
      clearForm();
    }
  });

  function clearForm() {
    expenseTitle = '';
    expenseAmount = '';
    titleError = '';
    amountError = '';
  }

  function validateForm(): boolean {
    titleError = '';
    amountError = '';

    if (!expenseTitle.trim()) {
      titleError = 'Title is required';
      return false;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount < 0) {
      amountError = 'Amount must be a valid number greater than or equal to 0';
      return false;
    }

    return true;
  }

  function saveExpense(): boolean {
    if (!validateForm()) return false;

    const amount = parseFloat(expenseAmount) || 0;

    if (isEditMode && editingExpense) {
      // Update existing expense
      updateRecurringExpense(editingExpense.id, {
        title: expenseTitle.trim(),
        amount: amount,
      });
    } else {
      // Add new expense
      addRecurringExpense({
        title: expenseTitle.trim(),
        amount: amount,
      });
    }

    // Notify parent to reload
    onSuccess();
    return true;
  }

  function handleCancel() {
    clearForm();
    editingExpense = null;
    open = false;
  }

  function handleUpdate() {
    const success = saveExpense();
    if (success) {
      // Always close drawer after successful update in edit mode
      clearForm();
      editingExpense = null;
      open = false;
    }
  }

  function handleDone() {
    saveExpense();
    clearForm();
    editingExpense = null;
    open = false;
  }

  function handleAddAnother() {
    saveExpense();
    clearForm();
    // Keep drawer open
  }
</script>

<Drawer bind:open placement="right" class="z-50">
  <div class="flex max-h-[100vh] w-full max-w-md flex-col bg-white dark:bg-neutral-800">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
    >
      <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">
        {isEditMode ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
      </P>
    </div>

    <!-- Form Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <form
        onsubmit={(e) => {
          e.preventDefault();
          if (isEditMode) {
            handleUpdate();
          } else {
            handleAddAnother();
          }
        }}
        class="flex flex-col gap-4"
      >
        <div>
          <P size="sm" class="mb-2">Title</P>
          <input
            type="text"
            bind:value={expenseTitle}
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
            bind:value={expenseAmount}
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
        <div class="flex flex-col gap-4 pt-4">
          <Button type="button" color="alternative" class="w-full" onclick={handleCancel}>
            Cancel
          </Button>
          {#if isEditMode}
            <Button type="button" class="w-full" onclick={handleUpdate}>Update</Button>
          {:else}
            <Button type="submit" class="w-full">Add Another</Button>
            <Button type="button" class="w-full" onclick={handleDone}>Done</Button>
          {/if}
        </div>
      </form>
    </div>
  </div>
</Drawer>
