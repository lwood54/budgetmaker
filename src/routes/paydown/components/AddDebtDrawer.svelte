<script lang="ts">
  import { Button, P, Drawer } from 'flowbite-svelte';
  import { addDebt, updateDebt, type DebtType, type PaydownDebt } from '../helpers';

  let {
    open = $bindable(false),
    onSuccess = () => {},
    editingDebt = $bindable<PaydownDebt | null>(null),
  } = $props();

  // Debt form fields
  let name = $state('');
  let amount = $state('');
  let interestRate = $state('');
  let monthlyPayment = $state('');
  let debtType = $state<DebtType>('credit-card');
  let priority = $state('1');

  // Validation state
  let nameError = $state('');
  let amountError = $state('');
  let interestRateError = $state('');
  let monthlyPaymentError = $state('');
  let priorityError = $state('');

  // Check if we're in edit mode
  const isEditMode = $derived(editingDebt !== null);

  // Load data when editing
  $effect(() => {
    if (open && editingDebt) {
      name = editingDebt.name;
      amount = editingDebt.amount.toString();
      interestRate = editingDebt.interestRate.toString();
      monthlyPayment = editingDebt.monthlyPayment.toString();
      debtType = editingDebt.type;
      priority = editingDebt.priority.toString();
      nameError = '';
      amountError = '';
      interestRateError = '';
      monthlyPaymentError = '';
      priorityError = '';
    } else if (open && !editingDebt) {
      // Reset form for add mode
      clearForm();
    }
  });

  function clearForm() {
    name = '';
    amount = '';
    interestRate = '';
    monthlyPayment = '';
    debtType = 'credit-card';
    priority = '1';
    nameError = '';
    amountError = '';
    interestRateError = '';
    monthlyPaymentError = '';
    priorityError = '';
  }

  function validateForm(): boolean {
    nameError = '';
    amountError = '';
    interestRateError = '';
    monthlyPaymentError = '';
    priorityError = '';

    if (!name.trim()) {
      nameError = 'Debt name is required';
      return false;
    }

    const amountVal = parseFloat(amount);
    if (isNaN(amountVal) || amountVal < 0) {
      amountError = 'Amount must be a valid number greater than or equal to 0';
      return false;
    }

    const interestRateVal = parseFloat(interestRate);
    if (isNaN(interestRateVal) || interestRateVal < 0) {
      interestRateError = 'Interest rate must be a valid number greater than or equal to 0';
      return false;
    }

    const monthlyPaymentVal = parseFloat(monthlyPayment);
    if (isNaN(monthlyPaymentVal) || monthlyPaymentVal < 0) {
      monthlyPaymentError = 'Monthly payment must be a valid number greater than or equal to 0';
      return false;
    }

    const priorityVal = parseInt(priority);
    if (isNaN(priorityVal) || priorityVal < 0) {
      priorityError = 'Priority must be a valid number greater than or equal to 0';
      return false;
    }

    return true;
  }

  function saveDebt(): boolean {
    if (!validateForm()) return false;

    const debtData = {
      name: name.trim(),
      type: debtType,
      amount: parseFloat(amount) || 0,
      interestRate: parseFloat(interestRate) || 0,
      monthlyPayment: parseFloat(monthlyPayment) || 0,
      priority: parseInt(priority) || 0,
    };

    if (isEditMode && editingDebt) {
      // Update existing debt
      updateDebt(editingDebt.id, debtData);
    } else {
      // Add new debt
      addDebt(debtData);
    }

    // Notify parent to reload
    onSuccess();
    return true;
  }

  function handleCancel() {
    clearForm();
    editingDebt = null;
    open = false;
  }

  function handleUpdate() {
    const success = saveDebt();
    if (success) {
      // Always close drawer after successful update in edit mode
      clearForm();
      editingDebt = null;
      open = false;
    }
  }

  function handleDone() {
    saveDebt();
    clearForm();
    editingDebt = null;
    open = false;
  }

  function handleAddAnother() {
    saveDebt();
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
        {isEditMode ? 'Edit Debt' : 'Add Debt'}
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
          <P size="sm" class="mb-2">Debt Name</P>
          <input
            type="text"
            bind:value={name}
            class="w-full rounded border px-3 py-2 text-neutral-900 {nameError
              ? 'border-red-500 dark:border-red-500'
              : 'border-neutral-300 dark:border-neutral-600'} dark:bg-neutral-800 dark:text-neutral-100"
            required
          />
          {#if nameError}
            <P size="xs" class="mt-1 text-red-600 dark:text-red-400">{nameError}</P>
          {/if}
        </div>
        <div>
          <P size="sm" class="mb-2">Debt Type</P>
          <select
            bind:value={debtType}
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          >
            <option value="credit-card">Credit Card</option>
            <option value="car">Car Loan</option>
            <option value="mortgage">Mortgage</option>
            <option value="student-loan">Student Loan</option>
            <option value="personal-loan">Personal Loan</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <P size="sm" class="mb-2">Debt Amount</P>
          <input
            type="number"
            bind:value={amount}
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
        <div>
          <P size="sm" class="mb-2">Interest Rate (%)</P>
          <input
            type="number"
            bind:value={interestRate}
            step="0.01"
            min="0"
            class="w-full rounded border px-3 py-2 text-neutral-900 {interestRateError
              ? 'border-red-500 dark:border-red-500'
              : 'border-neutral-300 dark:border-neutral-600'} dark:bg-neutral-800 dark:text-neutral-100"
            required
          />
          {#if interestRateError}
            <P size="xs" class="mt-1 text-red-600 dark:text-red-400">{interestRateError}</P>
          {/if}
        </div>
        <div>
          <P size="sm" class="mb-2">Monthly Payment</P>
          <input
            type="number"
            bind:value={monthlyPayment}
            step="0.01"
            min="0"
            class="w-full rounded border px-3 py-2 text-neutral-900 {monthlyPaymentError
              ? 'border-red-500 dark:border-red-500'
              : 'border-neutral-300 dark:border-neutral-600'} dark:bg-neutral-800 dark:text-neutral-100"
            required
          />
          {#if monthlyPaymentError}
            <P size="xs" class="mt-1 text-red-600 dark:text-red-400">{monthlyPaymentError}</P>
          {/if}
        </div>
        <div>
          <P size="sm" class="mb-2">Priority (1 = highest, 0 = skip snowball)</P>
          <input
            type="number"
            bind:value={priority}
            min="0"
            step="1"
            placeholder="1"
            class="w-full rounded border px-3 py-2 text-neutral-900 {priorityError
              ? 'border-red-500 dark:border-red-500'
              : 'border-neutral-300 dark:border-neutral-600'} dark:bg-neutral-800 dark:text-neutral-100"
            required
          />
          {#if priorityError}
            <P size="xs" class="mt-1 text-red-600 dark:text-red-400">{priorityError}</P>
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
