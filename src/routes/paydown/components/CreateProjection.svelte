<script lang="ts">
  import { Button, Label, Card, P } from 'flowbite-svelte';
  import Input from '$lib/components/Input.svelte';
  import Select from '$lib/components/Select.svelte';
  import { createProjection, getProjections } from '$lib/api/projections.remote';
  import { PlusOutline } from 'flowbite-svelte-icons';

  type Props = {
    onSuccess: () => void;
    onCancel?: () => void;
  };

  let { onSuccess, onCancel }: Props = $props();
  let isSubmitting = $state(false);
  let selectedPaydownStrategy = $state('');

  // Paydown items state
  type PaydownItem = {
    title: string;
    initialBalance: string;
    interestRate: string;
    minimumPayment: string;
  };
  let paydownItems = $state<PaydownItem[]>([]);

  // Recurring expenses state
  type RecurringExpense = {
    title: string;
    amount: string;
  };
  let recurringExpenses = $state<RecurringExpense[]>([]);

  // Income streams state
  type IncomeStream = {
    title: string;
    amount: string;
    sectionName: string;
  };
  let incomeStreams = $state<IncomeStream[]>([]);

  // Savings goals state
  type SavingsGoal = {
    title: string;
    amount: string;
    sectionName: string;
  };
  let savingsGoals = $state<SavingsGoal[]>([]);

  // Transfers state
  type Transfer = {
    title: string;
    amount: string;
    fromSection: string;
    toSection: string;
  };
  let transfers = $state<Transfer[]>([]);

  const paydownStrategyOptions = [
    { value: 'snowball', name: 'Snowball (Lowest Balance First)' },
    { value: 'avalanche', name: 'Avalanche (Highest Interest First)' },
    { value: 'highest_balance', name: 'Highest Balance First' },
    { value: 'lowest_balance', name: 'Lowest Balance First' },
    { value: 'custom', name: 'Custom' },
  ];

  function addPaydownItem() {
    paydownItems = [
      ...paydownItems,
      { title: '', initialBalance: '', interestRate: '', minimumPayment: '' },
    ];
  }

  function removePaydownItem(index: number) {
    paydownItems = paydownItems.filter((_, i) => i !== index);
  }

  function addRecurringExpense() {
    recurringExpenses = [...recurringExpenses, { title: '', amount: '' }];
  }

  function removeRecurringExpense(index: number) {
    recurringExpenses = recurringExpenses.filter((_, i) => i !== index);
  }

  function addIncomeStream() {
    incomeStreams = [...incomeStreams, { title: '', amount: '', sectionName: 'Income 1' }];
  }

  function removeIncomeStream(index: number) {
    incomeStreams = incomeStreams.filter((_, i) => i !== index);
  }

  function addSavingsGoal() {
    savingsGoals = [...savingsGoals, { title: '', amount: '', sectionName: 'Income 1' }];
  }

  function removeSavingsGoal(index: number) {
    savingsGoals = savingsGoals.filter((_, i) => i !== index);
  }

  function addTransfer() {
    transfers = [
      ...transfers,
      { title: '', amount: '', fromSection: 'Income 1', toSection: 'Income 2' },
    ];
  }

  function removeTransfer(index: number) {
    transfers = transfers.filter((_, i) => i !== index);
  }
</script>

<Card class="p-6">
  <h2 class="mb-4 text-2xl font-bold">Create New Projection</h2>
  <p class="mb-6 text-neutral-600 dark:text-neutral-400">
    Generate a 10-year financial projection with monthly intervals to track income, expenses,
    savings, and paydown items.
  </p>

  <form
    {...createProjection.enhance(async ({ form, submit }) => {
      isSubmitting = true;
      try {
        await submit();

        if (createProjection.result?.success === true) {
          form.reset();
          selectedPaydownStrategy = '';
          paydownItems = [];
          recurringExpenses = [];
          incomeStreams = [];
          savingsGoals = [];
          transfers = [];
          // Refresh projections list
          await getProjections().refresh();
          onSuccess();
        }
      } catch (error) {
        console.error('Error creating projection:', error);
      } finally {
        isSubmitting = false;
      }
    })}
    class="space-y-6"
  >
    <div>
      <Label for="projection-title" class="mb-2 block">Projection Title</Label>
      <Input
        field={createProjection.fields.title}
        placeholder="e.g., 10 Year Financial Plan"
        disabled={isSubmitting}
        class="text-xl"
      />
    </div>

    <div>
      <Label for="paydown-strategy" class="mb-2 block">Paydown Strategy</Label>
      <Select
        id="paydown-strategy"
        name="paydownStrategy"
        items={paydownStrategyOptions}
        bind:value={selectedPaydownStrategy}
        disabled={isSubmitting}
        placeholder="Select a paydown strategy"
        required
      />
      <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Choose how extra payments will be allocated to paydown items (credit cards, loans, etc.)
      </p>
    </div>

    <div>
      <Label for="start-year" class="mb-2 block">Start Year (Optional)</Label>
      <Input
        field={createProjection.fields.startYear}
        type="number"
        placeholder={new Date().getFullYear().toString()}
        disabled={isSubmitting}
      />
      <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Defaults to current year ({new Date().getFullYear()}). Projection will span 10 years from
        this start year.
      </p>
    </div>

    <!-- Paydown Items Section -->
    <div class="border-t border-neutral-200 pt-6 dark:border-neutral-700">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <Label class="mb-2 block text-lg font-semibold">Paydown Items</Label>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Add credit cards, loans, or other debts to track paydown progress
          </p>
        </div>
        <Button
          type="button"
          color="light"
          size="sm"
          onclick={addPaydownItem}
          disabled={isSubmitting}
          class="flex items-center gap-2"
        >
          <PlusOutline class="h-4 w-4" />
          Add Paydown Item
        </Button>
      </div>

      {#if paydownItems.length > 0}
        <div class="space-y-4">
          {#each paydownItems as item, index}
            <Card class="p-4">
              <div class="mb-4 flex items-center justify-between">
                <P class="font-semibold">Paydown Item #{index + 1}</P>
                <Button
                  type="button"
                  color="red"
                  size="xs"
                  onclick={() => removePaydownItem(index)}
                  disabled={isSubmitting}
                >
                  ×
                </Button>
              </div>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label for="paydown-title-{index}">Item Name</Label>
                  <input
                    id="paydown-title-{index}"
                    type="text"
                    placeholder="e.g., Credit Card, Auto Loan"
                    bind:value={item.title}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                <div>
                  <Label for="paydown-balance-{index}">Starting Balance ($)</Label>
                  <input
                    id="paydown-balance-{index}"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    bind:value={item.initialBalance}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                <div>
                  <Label for="paydown-interest-{index}">Interest Rate (%)</Label>
                  <input
                    id="paydown-interest-{index}"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    bind:value={item.interestRate}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                <div>
                  <Label for="paydown-min-payment-{index}">Minimum Payment ($)</Label>
                  <input
                    id="paydown-min-payment-{index}"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    bind:value={item.minimumPayment}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
              </div>
            </Card>
          {/each}
        </div>
      {:else}
        <P class="text-sm text-neutral-500 dark:text-neutral-400">
          No paydown items added yet. You can add them after creating the projection.
        </P>
      {/if}
    </div>

    <!-- Recurring Expenses Section -->
    <div class="border-t border-neutral-200 pt-6 dark:border-neutral-700">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <Label class="mb-2 block text-lg font-semibold">Recurring Expenses</Label>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Add fixed monthly expenses (rent, utilities, etc.)
          </p>
        </div>
        <Button
          type="button"
          color="light"
          size="sm"
          onclick={addRecurringExpense}
          disabled={isSubmitting}
          class="flex items-center gap-2"
        >
          <PlusOutline class="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {#if recurringExpenses.length > 0}
        <div class="space-y-4">
          {#each recurringExpenses as expense, index}
            <Card class="p-4">
              <div class="mb-4 flex items-center justify-between">
                <P class="font-semibold">Expense #{index + 1}</P>
                <Button
                  type="button"
                  color="red"
                  size="xs"
                  onclick={() => removeRecurringExpense(index)}
                  disabled={isSubmitting}
                >
                  ×
                </Button>
              </div>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label for="expense-title-{index}">Expense Name</Label>
                  <input
                    id="expense-title-{index}"
                    type="text"
                    placeholder="e.g., Rent, Utilities"
                    bind:value={expense.title}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                <div>
                  <Label for="expense-amount-{index}">Monthly Amount ($)</Label>
                  <input
                    id="expense-amount-{index}"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    bind:value={expense.amount}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
              </div>
            </Card>
          {/each}
        </div>
      {:else}
        <P class="text-sm text-neutral-500 dark:text-neutral-400">
          No recurring expenses added yet. You can add them after creating the projection.
        </P>
      {/if}
    </div>

    <!-- Income Streams Section -->
    <div class="border-t border-neutral-200 pt-6 dark:border-neutral-700">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <Label class="mb-2 block text-lg font-semibold">Income Streams</Label>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Add monthly income sources (salary, freelance, etc.)
          </p>
        </div>
        <Button
          type="button"
          color="light"
          size="sm"
          onclick={addIncomeStream}
          disabled={isSubmitting}
          class="flex items-center gap-2"
        >
          <PlusOutline class="h-4 w-4" />
          Add Income
        </Button>
      </div>

      {#if incomeStreams.length > 0}
        <div class="space-y-4">
          {#each incomeStreams as income, index}
            <Card class="p-4">
              <div class="mb-4 flex items-center justify-between">
                <P class="font-semibold">Income #{index + 1}</P>
                <Button
                  type="button"
                  color="red"
                  size="xs"
                  onclick={() => removeIncomeStream(index)}
                  disabled={isSubmitting}
                >
                  ×
                </Button>
              </div>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label for="income-title-{index}">Income Name</Label>
                  <input
                    id="income-title-{index}"
                    type="text"
                    placeholder="e.g., Salary, Freelance"
                    bind:value={income.title}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                <div>
                  <Label for="income-amount-{index}">Monthly Amount ($)</Label>
                  <input
                    id="income-amount-{index}"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    bind:value={income.amount}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                <div>
                  <Label for="income-section-{index}">Section Name</Label>
                  <input
                    id="income-section-{index}"
                    type="text"
                    placeholder="e.g., Income 1"
                    bind:value={income.sectionName}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
              </div>
            </Card>
          {/each}
        </div>
      {:else}
        <P class="text-sm text-neutral-500 dark:text-neutral-400">
          No income streams added yet. You can add them after creating the projection.
        </P>
      {/if}
    </div>

    <!-- Savings Goals Section -->
    <div class="border-t border-neutral-200 pt-6 dark:border-neutral-700">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <Label class="mb-2 block text-lg font-semibold">Savings Goals</Label>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Add monthly savings targets (emergency fund, vacation, etc.)
          </p>
        </div>
        <Button
          type="button"
          color="light"
          size="sm"
          onclick={addSavingsGoal}
          disabled={isSubmitting}
          class="flex items-center gap-2"
        >
          <PlusOutline class="h-4 w-4" />
          Add Savings
        </Button>
      </div>

      {#if savingsGoals.length > 0}
        <div class="space-y-4">
          {#each savingsGoals as savings, index}
            <Card class="p-4">
              <div class="mb-4 flex items-center justify-between">
                <P class="font-semibold">Savings Goal #{index + 1}</P>
                <Button
                  type="button"
                  color="red"
                  size="xs"
                  onclick={() => removeSavingsGoal(index)}
                  disabled={isSubmitting}
                >
                  ×
                </Button>
              </div>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label for="savings-title-{index}">Savings Name</Label>
                  <input
                    id="savings-title-{index}"
                    type="text"
                    placeholder="e.g., Emergency Fund, Vacation"
                    bind:value={savings.title}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                <div>
                  <Label for="savings-amount-{index}">Monthly Amount ($)</Label>
                  <input
                    id="savings-amount-{index}"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    bind:value={savings.amount}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                <div>
                  <Label for="savings-section-{index}">Section Name</Label>
                  <input
                    id="savings-section-{index}"
                    type="text"
                    placeholder="e.g., Income 1"
                    bind:value={savings.sectionName}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
              </div>
            </Card>
          {/each}
        </div>
      {:else}
        <P class="text-sm text-neutral-500 dark:text-neutral-400">
          No savings goals added yet. You can add them after creating the projection.
        </P>
      {/if}
    </div>

    <!-- Transfers Section -->
    <div class="border-t border-neutral-200 pt-6 dark:border-neutral-700">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <Label class="mb-2 block text-lg font-semibold">Transfers</Label>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Add transfers between income sections
          </p>
        </div>
        <Button
          type="button"
          color="light"
          size="sm"
          onclick={addTransfer}
          disabled={isSubmitting}
          class="flex items-center gap-2"
        >
          <PlusOutline class="h-4 w-4" />
          Add Transfer
        </Button>
      </div>

      {#if transfers.length > 0}
        <div class="space-y-4">
          {#each transfers as transfer, index}
            <Card class="p-4">
              <div class="mb-4 flex items-center justify-between">
                <P class="font-semibold">Transfer #{index + 1}</P>
                <Button
                  type="button"
                  color="red"
                  size="xs"
                  onclick={() => removeTransfer(index)}
                  disabled={isSubmitting}
                >
                  ×
                </Button>
              </div>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <Label for="transfer-title-{index}">Transfer Name</Label>
                  <input
                    id="transfer-title-{index}"
                    type="text"
                    placeholder="e.g., Transfer to Savings"
                    bind:value={transfer.title}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                <div>
                  <Label for="transfer-amount-{index}">Amount ($)</Label>
                  <input
                    id="transfer-amount-{index}"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    bind:value={transfer.amount}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                <div>
                  <Label for="transfer-from-{index}">From Section</Label>
                  <input
                    id="transfer-from-{index}"
                    type="text"
                    placeholder="e.g., Income 1"
                    bind:value={transfer.fromSection}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
                <div>
                  <Label for="transfer-to-{index}">To Section</Label>
                  <input
                    id="transfer-to-{index}"
                    type="text"
                    placeholder="e.g., Income 2"
                    bind:value={transfer.toSection}
                    disabled={isSubmitting}
                    class="focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400"
                  />
                </div>
              </div>
            </Card>
          {/each}
        </div>
      {:else}
        <P class="text-sm text-neutral-500 dark:text-neutral-400">
          No transfers added yet. You can add them after creating the projection.
        </P>
      {/if}
    </div>

    <div class="flex w-full gap-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
      {#if onCancel}
        <Button
          type="button"
          onclick={onCancel}
          color="alternative"
          disabled={isSubmitting}
          class="flex-1"
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
        {isSubmitting ? 'Creating...' : 'Create Projection'}
      </Button>
    </div>
  </form>
</Card>
