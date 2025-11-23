<script lang="ts">
  import { Drawer, Button, P } from 'flowbite-svelte';
  import { CloseOutline, ArrowLeftOutline } from 'flowbite-svelte-icons';
  import { getBudgets } from '$lib/api/budgets.remote';
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import AddBudget from './AddBudget.svelte';
  import AddCategory from './AddCategory.svelte';
  import AddItem from './AddItem.svelte';

  type DrawerStep = 'select' | 'budget' | 'category' | 'item';

  let { open = $bindable(false) } = $props();

  const budgetsQuery = getBudgets();
  const budgets = await budgetsQuery;

  let currentStep = $state<DrawerStep>('select');
  let isSubmitting = $state(false);
  let formError = $state<string>('');
  let itemBudgetId = $state('');

  const budgetOptions = $derived(
    budgets.map((b: BudgetWithRelations) => ({
      value: b.uuid,
      name: b.name,
    })),
  );

  const categoryOptions = $derived(() => {
    if (!itemBudgetId) return [];
    const budget = budgets.find((b: BudgetWithRelations) => b.uuid === itemBudgetId);
    return (
      budget?.categories.map((c: { uuid: string; name: string }) => ({
        value: c.uuid,
        name: c.name,
      })) ?? []
    );
  });

  function resetForms() {
    formError = '';
    isSubmitting = false;
    itemBudgetId = '';
  }

  function handleClose() {
    open = false;
    setTimeout(() => {
      currentStep = 'select';
      resetForms();
    }, 300);
  }

  function goToStep(step: DrawerStep) {
    currentStep = step;
    formError = '';
  }

  async function handleSuccess() {
    handleClose();
  }

  function handleBudgetChange(budgetId: string) {
    itemBudgetId = budgetId;
  }
</script>

<Drawer bind:open placement="bottom" class="z-50">
  <div class="flex max-h-[90vh] flex-col bg-white dark:bg-neutral-800">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
    >
      {#if currentStep === 'select'}
        <P size="lg" class="text-primary-900 dark:text-primary-200 font-semibold">Add New</P>
      {:else}
        <Button
          color="alternative"
          size="sm"
          outline
          class="border-none p-2"
          onclick={() => goToStep('select')}
          disabled={isSubmitting}
        >
          <ArrowLeftOutline class="text-primary-900 dark:text-primary-200 h-5 w-5" />
        </Button>
        <P size="lg" class="text-primary-900 dark:text-primary-200 font-semibold">
          {currentStep === 'budget'
            ? 'New Budget'
            : currentStep === 'category'
              ? 'New Category'
              : 'New Purchase'}
        </P>
        <div class="w-9"></div>
      {/if}
      <Button
        color="alternative"
        size="sm"
        outline
        class="border-none p-2"
        onclick={handleClose}
        disabled={isSubmitting}
      >
        <CloseOutline class="text-primary-900 dark:text-primary-200 h-5 w-5" />
      </Button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      {#if currentStep === 'select'}
        <!-- Selection Step -->
        <div class="space-y-3">
          <Button
            color="primary"
            size="lg"
            class="w-full justify-start"
            onclick={() => goToStep('budget')}
          >
            <P class="text-left">Create New Budget</P>
          </Button>
          <Button
            color="primary"
            size="lg"
            class="w-full justify-start"
            onclick={() => goToStep('category')}
            disabled={budgets.length === 0}
          >
            <P class="text-left">Add Category</P>
          </Button>
          <Button
            color="primary"
            size="lg"
            class="w-full justify-start"
            onclick={() => goToStep('item')}
            disabled={budgets.length === 0}
          >
            <P class="text-left">Record Purchase</P>
          </Button>
        </div>
      {:else if currentStep === 'budget'}
        <!-- Budget Form -->
        <AddBudget onSuccess={handleSuccess} />
      {:else if currentStep === 'category'}
        <!-- Category Form -->
        <AddCategory
          {isSubmitting}
          {formError}
          {budgetOptions}
          selectedBudgetId={budgets.length === 1 ? budgets[0].uuid : ''}
          onSubmittingChange={(value) => (isSubmitting = value)}
          onErrorChange={(value) => (formError = value)}
          onSuccess={handleSuccess}
        />
      {:else if currentStep === 'item'}
        <!-- Item Form -->
        <AddItem
          {isSubmitting}
          {formError}
          {budgetOptions}
          categoryOptions={categoryOptions()}
          selectedBudgetId={budgets.length === 1 ? budgets[0].uuid : ''}
          onSubmittingChange={(value) => (isSubmitting = value)}
          onErrorChange={(value) => (formError = value)}
          onSuccess={handleSuccess}
          onBudgetChange={handleBudgetChange}
        />
      {/if}
    </div>
  </div>
</Drawer>
