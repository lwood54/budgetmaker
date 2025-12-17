<script lang="ts">
  import { Drawer, Button, P } from 'flowbite-svelte';
  import {
    ArrowLeftOutline,
    FolderPlusOutline,
    TagOutline,
    ShoppingBagOutline,
  } from 'flowbite-svelte-icons';
  import { getBudgets, getCategories } from '$lib/api/budgets.remote';
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import AddBudget from './AddBudget.svelte';
  import AddCategory from './AddCategory.svelte';
  import AddItem from './AddItem.svelte';

  type DrawerStep = 'select' | 'budget' | 'category' | 'item';

  let { open = $bindable(false) } = $props();

  const budgetsQuery = getBudgets();
  let budgets = $state<BudgetWithRelations[]>([]);

  // Initial load
  budgetsQuery.then((result) => {
    budgets = result;
  });

  let currentStep = $state<DrawerStep>('select');
  let itemBudgetId = $state('');

  // Load budgets when drawer opens or when navigating to steps that need them
  async function loadBudgets() {
    await budgetsQuery.refresh();
    budgets = await budgetsQuery;
  }

  // Load budgets when drawer opens and reset to select step
  $effect(() => {
    if (open) {
      // Ensure we start at the select step when drawer opens
      currentStep = 'select';
      resetForms();
      loadBudgets();
    }
  });

  // Refresh budgets when navigating to category or item steps
  $effect(() => {
    if (open && (currentStep === 'category' || currentStep === 'item')) {
      loadBudgets();
    }
  });

  const budgetOptions = $derived(
    budgets.map((b: BudgetWithRelations) => ({
      value: b.uuid,
      name: b.name,
    })),
  );

  let categories = $state<Array<{ uuid: string; name: string }>>([]);

  async function loadCategories(budgetId: string) {
    if (budgetId) {
      const cats = await getCategories(budgetId);
      // Only update if budgetId hasn't changed (avoid race conditions)
      if (itemBudgetId === budgetId) {
        categories = cats;
      }
    } else {
      categories = [];
    }
  }

  $effect(() => {
    // Track itemBudgetId directly to ensure effect runs when it changes
    const budgetId = itemBudgetId;
    loadCategories(budgetId);
  });

  const categoryOptions = $derived(
    categories.map((c) => ({
      value: c.uuid,
      name: c.name,
    })),
  );

  function resetForms() {
    itemBudgetId = '';
    categories = [];
  }

  function handleClose() {
    // Reset to select step immediately before closing
    currentStep = 'select';
    resetForms();
    open = false;
  }

  async function goToStep(step: DrawerStep) {
    currentStep = step;

    // Refresh budgets when navigating to category or item steps
    if (step === 'category' || step === 'item') {
      await loadBudgets();
    }

    // Refresh categories when navigating to item step
    if (step === 'item' && itemBudgetId) {
      const cats = await getCategories(itemBudgetId);
      categories = cats;
    }
  }

  async function handleSuccess() {
    // Refresh budgets after successful creation
    await loadBudgets();

    // If we're on the item step and have a budget selected, refresh categories too
    if (currentStep === 'item' && itemBudgetId) {
      await loadCategories(itemBudgetId);
    }

    handleClose();
  }

  function handleBudgetChange(budgetId: string) {
    itemBudgetId = budgetId;
  }
</script>

<!-- <Drawer bind:open placement="right" class="z-50">
  <div class="flex max-h-[100vh] w-full max-w-md flex-col bg-white dark:bg-neutral-800"> -->
<Drawer bind:open placement="top" class="z-50">
  <div class="flex max-h-[90vh] flex-col bg-white dark:bg-neutral-800">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
    >
      {#if currentStep === 'select'}
        <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">Add New</P>
      {:else}
        <Button
          color="alternative"
          size="sm"
          outline
          class="border-none p-2"
          onclick={() => goToStep('select')}
        >
          <ArrowLeftOutline class="text-primary-900 dark:text-primary-200 h-5 w-5" />
        </Button>
        <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">
          {currentStep === 'budget'
            ? 'New Budget'
            : currentStep === 'category'
              ? 'New Category'
              : 'New Purchase'}
        </P>
        <div class="w-9"></div>
      {/if}
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      {#if currentStep === 'select'}
        <!-- Selection Step -->
        <div class="flex flex-wrap justify-between gap-3 max-[540px]:flex-col">
          <Button
            color="primary"
            size="lg"
            class="flex flex-col items-center justify-center gap-2 p-4 max-[540px]:h-auto max-[540px]:w-full min-[540px]:aspect-square min-[540px]:max-w-[150px] min-[540px]:min-w-[150px] min-[540px]:flex-1"
            onclick={() => goToStep('budget')}
          >
            <FolderPlusOutline class="h-8 w-8" />
            <P class="text-center text-base">Create Budget</P>
          </Button>
          <Button
            color="primary"
            size="lg"
            class="flex flex-col items-center justify-center gap-2 p-4 max-[540px]:h-auto max-[540px]:w-full min-[540px]:aspect-square min-[540px]:max-w-[150px] min-[540px]:min-w-[150px] min-[540px]:flex-1"
            onclick={() => goToStep('category')}
            disabled={budgets.length === 0}
          >
            <TagOutline class="h-8 w-8" />
            <P class="text-center text-base">Create Category</P>
          </Button>
          <Button
            color="primary"
            size="lg"
            class="flex flex-col items-center justify-center gap-2 p-4 max-[540px]:h-auto max-[540px]:w-full min-[540px]:aspect-square min-[540px]:max-w-[150px] min-[540px]:min-w-[150px] min-[540px]:flex-1"
            onclick={() => goToStep('item')}
            disabled={budgets.length === 0}
          >
            <ShoppingBagOutline class="h-8 w-8" />
            <P class="text-center text-base">Record Purchase</P>
          </Button>
        </div>
      {:else if currentStep === 'budget'}
        <!-- Budget Form -->
        <AddBudget onSuccess={handleSuccess} />
      {:else if currentStep === 'category'}
        <!-- Category Form -->
        <AddCategory
          {budgetOptions}
          selectedBudgetId={budgets.length === 1 ? budgets[0].uuid : ''}
          onSuccess={handleSuccess}
        />
      {:else if currentStep === 'item'}
        <!-- Item Form -->
        <AddItem
          {budgetOptions}
          {categoryOptions}
          selectedBudgetId={budgets.length === 1 ? budgets[0].uuid : ''}
          onSuccess={handleSuccess}
          onBudgetChange={handleBudgetChange}
        />
      {/if}
    </div>
  </div>
</Drawer>
