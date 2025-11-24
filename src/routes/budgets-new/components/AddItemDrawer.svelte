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
  const budgets = await budgetsQuery;

  let currentStep = $state<DrawerStep>('select');
  let itemBudgetId = $state('');

  const budgetOptions = $derived(
    budgets.map((b: BudgetWithRelations) => ({
      value: b.uuid,
      name: b.name,
    })),
  );

  let categories = $state<Array<{ uuid: string; name: string }>>([]);

  $effect(() => {
    // Track itemBudgetId directly to ensure effect runs when it changes
    const budgetId = itemBudgetId;

    if (budgetId) {
      getCategories(budgetId).then((cats) => {
        // Only update if budgetId hasn't changed (avoid race conditions)
        if (itemBudgetId === budgetId) {
          categories = cats;
        }
      });
    } else {
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
  }

  async function handleSuccess() {
    handleClose();
  }

  function handleBudgetChange(budgetId: string) {
    itemBudgetId = budgetId;
  }
</script>

<!-- <Drawer bind:open placement="right" class="z-50">
  <div class="flex max-h-[100vh] w-full max-w-md flex-col bg-white dark:bg-neutral-800"> -->
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
            <P class="text-center text-sm">Create Budget</P>
          </Button>
          <Button
            color="primary"
            size="lg"
            class="flex flex-col items-center justify-center gap-2 p-4 max-[540px]:h-auto max-[540px]:w-full min-[540px]:aspect-square min-[540px]:max-w-[150px] min-[540px]:min-w-[150px] min-[540px]:flex-1"
            onclick={() => goToStep('category')}
            disabled={budgets.length === 0}
          >
            <TagOutline class="h-8 w-8" />
            <P class="text-center text-sm">Create Category</P>
          </Button>
          <Button
            color="primary"
            size="lg"
            class="flex flex-col items-center justify-center gap-2 p-4 max-[540px]:h-auto max-[540px]:w-full min-[540px]:aspect-square min-[540px]:max-w-[150px] min-[540px]:min-w-[150px] min-[540px]:flex-1"
            onclick={() => goToStep('item')}
            disabled={budgets.length === 0}
          >
            <ShoppingBagOutline class="h-8 w-8" />
            <P class="text-center text-sm">Record Purchase</P>
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
