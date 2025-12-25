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

  type Props = {
    open?: boolean;
    initialStep?: DrawerStep;
    selectedBudgetId?: string;
    onSuccess?: () => void;
    onClose?: () => void;
  };

  let {
    open = $bindable(false),
    initialStep = 'select',
    selectedBudgetId = '',
    onSuccess,
    onClose,
  }: Props = $props();

  const budgetsQuery = getBudgets();
  let budgets = $state<BudgetWithRelations[]>([]);

  // Initial load
  budgetsQuery.then((result) => {
    budgets = result?.data ?? [];
  });

  let currentStep = $state<DrawerStep>('select');
  let itemBudgetId = $state('');
  let wasOpen = $state(false);

  // Load budgets when drawer opens or when navigating to steps that need them
  async function loadBudgets() {
    await budgetsQuery.refresh();
    const result = await budgetsQuery;
    budgets = result?.data ?? [];
  }

  // Load budgets when drawer opens and set initial step
  $effect(() => {
    if (open) {
      // Set the initial step when drawer opens
      currentStep = initialStep;
      resetForms();

      // Set the selected budget ID if provided
      if (selectedBudgetId) {
        itemBudgetId = selectedBudgetId;
      }

      loadBudgets();

      // If starting at category or item step, navigate to it
      // This will also load categories if needed
      if (initialStep === 'category' || initialStep === 'item') {
        goToStep(initialStep);
      }
      wasOpen = true;
    } else if (wasOpen) {
      // When drawer closes (and it was previously open), call onClose callback if provided
      if (onClose) {
        onClose();
      }
      // Reset to select step when drawer closes
      currentStep = 'select';
      resetForms();
      wasOpen = false;
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
    // Track both currentStep and itemBudgetId to ensure categories load when needed
    // Only load categories if we're on the item step and the drawer is open
    // This prevents loading categories when not needed and avoids race conditions
    if (open && currentStep === 'item' && itemBudgetId) {
      const budgetId = itemBudgetId;
      loadCategories(budgetId);
    } else if (!open || currentStep !== 'item') {
      // Clear categories when not on item step or drawer is closed
      categories = [];
    }
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

  async function goToStep(step: DrawerStep) {
    currentStep = step;

    // Refresh budgets when navigating to category or item steps
    if (step === 'category' || step === 'item') {
      await loadBudgets();
    }

    // Refresh categories when navigating to item step
    // Use the current itemBudgetId value to ensure we load for the correct budget
    const budgetIdToLoad = itemBudgetId;
    if (step === 'item' && budgetIdToLoad) {
      const cats = await getCategories(budgetIdToLoad);
      // Only update if budgetId hasn't changed (avoid race conditions)
      if (itemBudgetId === budgetIdToLoad) {
        categories = cats;
      }
    }
  }

  async function handleSuccess() {
    // Refresh budgets after successful creation
    await loadBudgets();

    // If we're on the item step and have a budget selected, refresh categories too
    if (currentStep === 'item' && itemBudgetId) {
      await loadCategories(itemBudgetId);
    }

    // Call the onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }

    handleCloseInternal();
  }

  function handleCloseInternal() {
    // Reset to select step immediately before closing
    currentStep = 'select';
    resetForms();
    wasOpen = false; // Set this before setting open to false to prevent double callback
    open = false;

    // Call the onClose callback if provided
    if (onClose) {
      onClose();
    }
  }

  function handleBudgetChange(budgetId: string) {
    itemBudgetId = budgetId;
  }
</script>

<Drawer bind:open placement="right" class="z-50">
  <div class="flex max-h-[100vh] w-full max-w-md flex-col bg-white dark:bg-neutral-800">
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
          selectedBudgetId={selectedBudgetId || (budgets.length === 1 ? budgets[0].uuid : '')}
          onSuccess={handleSuccess}
        />
      {:else if currentStep === 'item'}
        <!-- Item Form -->
        <AddItem
          {budgetOptions}
          {categoryOptions}
          selectedBudgetId={selectedBudgetId || (budgets.length === 1 ? budgets[0].uuid : '')}
          onSuccess={handleSuccess}
          onBudgetChange={handleBudgetChange}
        />
      {/if}
    </div>
  </div>
</Drawer>
