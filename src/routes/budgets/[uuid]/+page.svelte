<script lang="ts">
  import { Button, P, Progressbar, Search, Modal, Drawer, Input } from 'flowbite-svelte';
  import { ArrowLeftOutline, AdjustmentsHorizontalOutline } from 'flowbite-svelte-icons';
  import {
    getBudget,
    deleteBudgetItem,
    deleteCategory,
    updateCategory,
    updateBudgetItem,
    getCategories,
  } from '$lib/api/budgets.remote';
  import { formatCurrency, centsToDollars } from '$lib/utils/money';
  import { getCategoryTotalSpent, getCategory } from '$lib/helpers/budgets';
  import { isoStringToDate } from '$lib/helpers/conversions';
  import { Datepicker } from 'flowbite-svelte';
  import { goto } from '$app/navigation';
  import { Route } from '$lib/constants/routes';
  import type { BudgetItem } from '$lib/server/db/schema';
  import Select from '$lib/components/Select.svelte';
  import MultiSelect from '$lib/components/MultiSelect.svelte';
  import EditIcon from '$lib/components/EditIcon.svelte';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';
  import EditBudgetDrawer from '../components/EditBudgetDrawer.svelte';
  import DeleteBudgetModal from '../components/DeleteBudgetModal.svelte';
  import { onMount } from 'svelte';

  let { params } = $props();

  const budget = $derived(await getBudget(params.uuid));

  // Search and filter state
  let searchQuery = $state('');
  let categorySearchQuery = $state('');
  let selectedCategoryFilters = $state<string[]>([]);
  let showFilters = $state(false);
  let showCategoryFilters = $state(false);

  // Delete state for purchases
  let deleteModalOpen = $state(false);
  let itemToDelete = $state<BudgetItem | null>(null);
  let isDeleting = $state(false);

  // Delete budget state
  let deleteBudgetModalOpen = $state(false);

  // Delete state for categories
  let deleteCategoryModalOpen = $state(false);
  let categoryToDelete = $state<CategoryWithStatus | null>(null);
  let isDeletingCategory = $state(false);

  // Edit budget state
  let editDrawerOpen = $state(false);

  // Edit category state
  let editCategoryDrawerOpen = $state(false);
  let categoryToEdit = $state<CategoryWithStatus | null>(null);
  let categoryName = $state('');
  let categoryLimit = $state('');
  let isUpdatingCategory = $state(false);
  let shouldRefreshCategory = $state(false);

  // Edit purchase item state
  let editItemDrawerOpen = $state(false);
  let itemToEdit = $state<BudgetItem | null>(null);
  let itemName = $state('');
  let itemAmount = $state('');
  let itemCategoryId = $state('');
  let itemPurchaseDate = $state<Date>(new Date());
  let isUpdatingItem = $state(false);
  let shouldRefreshItem = $state(false);
  let categoryOptions = $state<Array<{ value: string; name: string }>>([]);

  // Category sort state
  type CategorySortOption =
    | 'title-a-z'
    | 'title-z-a'
    | 'recently-used'
    | 'amount-low-high'
    | 'amount-high-low';
  let categorySortBy = $state<CategorySortOption>('title-a-z');

  function getBudgetProgress(budgetSpent: number, budgetLimit: number) {
    if (budgetLimit > 0 && budgetSpent > 0) {
      const progress = (budgetSpent / budgetLimit) * 100;
      // Cap progress at 100% to prevent overflow
      return Math.min(progress, 100);
    }
    if (budgetLimit > 0 && budgetSpent === 0) {
      return 0;
    }
    return 0;
  }

  const budgetLimit = $derived(
    budget ? budget.categories.reduce((acc, category) => acc + category.limit, 0) : 0,
  );
  const budgetSpent = $derived(
    budget ? budget.budgetItems.reduce((acc, item) => acc + item.amount, 0) : 0,
  );
  const details = $derived({
    remaining: budgetLimit - budgetSpent,
    progress: getBudgetProgress(budgetSpent, budgetLimit),
    isOverBudget: budgetSpent > budgetLimit,
    isWithin20Percent: budgetSpent > budgetLimit * 0.8,
  });
  const progressColor = $derived(() => {
    if (details.isOverBudget) {
      return 'red';
    }
    if (details.isWithin20Percent) {
      return 'yellow';
    }
    return 'green';
  });

  // Filter categories - for multi-select (no "All" option needed)
  const categoryFilterOptions = $derived(() => {
    if (!budget) return [];
    return budget.categories.map((cat) => ({ value: cat.uuid, name: cat.name }));
  });

  // Filter and search purchases
  const filteredPurchases = $derived((): BudgetItem[] => {
    if (!budget) return [];

    let items: BudgetItem[] = [...budget.budgetItems];

    // Filter by category (multi-select)
    if (selectedCategoryFilters.length > 0) {
      items = items.filter((item) => selectedCategoryFilters.includes(item.categoryId));
    }

    // Search by name or category
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter((item) => {
        const category = getCategory(item.categoryId, budget.categories);
        return (
          item.name.toLowerCase().includes(query) || category?.name.toLowerCase().includes(query)
        );
      });
    }

    // Sort by date (newest first)
    const sorted = items.sort((a, b) => {
      return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
    });
    return sorted;
  });

  // Filter categories by status
  let categoryFilterStatus = $state<'all' | 'over' | 'near' | 'good'>('all');

  type CategoryWithStatus = {
    uuid: string;
    name: string;
    limit: number;
    budgetId: string;
    createdAt: string;
    updatedAt: string;
    categorySpent: number;
    isOverLimit: boolean;
    isNearLimit: boolean;
    status: 'over' | 'near' | 'good';
  };

  // Get most recent purchase date for a category
  function getCategoryMostRecentActivity(categoryUuid: string): Date {
    if (!budget) return new Date(0);
    const categoryItems = budget.budgetItems.filter((item) => item.categoryId === categoryUuid);
    if (categoryItems.length > 0) {
      return categoryItems.reduce((latest, item) => {
        const itemDate = new Date(item.purchaseDate);
        return itemDate > latest ? itemDate : latest;
      }, new Date(0));
    }
    return new Date(0);
  }

  const filteredCategories = $derived((): CategoryWithStatus[] => {
    if (!budget) return [];

    let categories: CategoryWithStatus[] = budget.categories.map((category) => {
      const categorySpent = getCategoryTotalSpent(category.uuid, budget.budgetItems);
      const isOverLimit = categorySpent > category.limit;
      const isNearLimit = categorySpent > category.limit * 0.8;
      return {
        ...category,
        categorySpent,
        isOverLimit,
        isNearLimit,
        status: (isOverLimit ? 'over' : isNearLimit ? 'near' : 'good') as 'over' | 'near' | 'good',
      };
    });

    // Filter by status
    if (categoryFilterStatus === 'over') {
      categories = categories.filter((cat) => cat.isOverLimit);
    } else if (categoryFilterStatus === 'near') {
      categories = categories.filter((cat) => cat.isNearLimit && !cat.isOverLimit);
    } else if (categoryFilterStatus === 'good') {
      categories = categories.filter((cat) => !cat.isNearLimit && !cat.isOverLimit);
    }

    // Search by category name
    if (categorySearchQuery?.trim()) {
      const query = categorySearchQuery.toLowerCase().trim();
      categories = categories.filter((cat) => cat.name.toLowerCase().includes(query));
    }

    // Sort categories
    switch (categorySortBy) {
      case 'title-a-z':
        categories.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'title-z-a':
        categories.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'recently-used':
        categories.sort((a, b) => {
          const aRecent = getCategoryMostRecentActivity(a.uuid).getTime();
          const bRecent = getCategoryMostRecentActivity(b.uuid).getTime();
          return bRecent - aRecent;
        });
        break;
      case 'amount-low-high':
        categories.sort((a, b) => a.limit - b.limit);
        break;
      case 'amount-high-low':
        categories.sort((a, b) => b.limit - a.limit);
        break;
    }

    return categories;
  });

  function handleDeleteClick(item: BudgetItem, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    itemToDelete = item;
    deleteModalOpen = true;
  }

  function handleDeleteCancel() {
    deleteModalOpen = false;
    itemToDelete = null;
  }

  async function handleDeleteSuccess() {
    await getBudget(params.uuid).refresh();
    deleteModalOpen = false;
    itemToDelete = null;
  }

  function handleDeleteCategoryClick(category: CategoryWithStatus, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    categoryToDelete = category;
    deleteCategoryModalOpen = true;
  }

  function handleDeleteCategoryCancel() {
    deleteCategoryModalOpen = false;
    categoryToDelete = null;
  }

  async function handleDeleteCategorySuccess() {
    await getBudget(params.uuid).refresh();
    deleteCategoryModalOpen = false;
    categoryToDelete = null;
  }

  function handleEditClick() {
    if (budget) {
      editDrawerOpen = true;
    }
  }

  function handleEditSuccess() {
    getBudget(params.uuid).refresh();
    editDrawerOpen = false;
  }

  function handleEditCancel() {
    editDrawerOpen = false;
  }

  function handleDeleteBudgetClick() {
    if (budget) {
      deleteBudgetModalOpen = true;
    }
  }

  function handleDeleteBudgetSuccess() {
    // Navigate back to budgets list page after successful deletion
    goto(Route.budgets);
  }

  function handleDeleteBudgetCancel() {
    deleteBudgetModalOpen = false;
  }

  function handleEditCategoryClick(category: CategoryWithStatus, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    categoryToEdit = category;
    categoryName = category.name;
    categoryLimit = centsToDollars(category.limit).toString();
    editCategoryDrawerOpen = true;
  }

  function handleEditCategoryCancel() {
    editCategoryDrawerOpen = false;
    categoryToEdit = null;
    categoryName = '';
    categoryLimit = '';
  }

  function handleEditCategorySuccess() {
    shouldRefreshCategory = true;
    editCategoryDrawerOpen = false;
  }

  // Watch for category drawer close and refresh when it closes
  let prevEditCategoryDrawerOpen = $state(false);
  $effect(() => {
    if (prevEditCategoryDrawerOpen && !editCategoryDrawerOpen && shouldRefreshCategory) {
      // Drawer just closed, use microtask to wait for DOM updates, then wait for animation
      Promise.resolve().then(() => {
        // Wait for CSS transition to complete (typically 300ms for drawer)
        // Use requestAnimationFrame to ensure we're after the browser's paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Additional frame to ensure transition has started
            requestAnimationFrame(async () => {
              await getBudget(params.uuid).refresh();
              categoryToEdit = null;
              categoryName = '';
              categoryLimit = '';
              shouldRefreshCategory = false;
            });
          });
        });
      });
    }
    prevEditCategoryDrawerOpen = editCategoryDrawerOpen;
  });

  function handleEditItemClick(item: BudgetItem, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    itemToEdit = item;
    itemName = item.name;
    itemAmount = centsToDollars(item.amount).toString();
    itemCategoryId = item.categoryId;
    itemPurchaseDate = new Date(item.purchaseDate);

    // Load categories for the budget
    if (budget) {
      getCategories(budget.uuid).then((cats) => {
        categoryOptions = cats.map((cat) => ({
          value: cat.uuid,
          name: cat.name,
        }));
      });
    }

    editItemDrawerOpen = true;
  }

  function handleEditItemCancel() {
    editItemDrawerOpen = false;
    itemToEdit = null;
    itemName = '';
    itemAmount = '';
    itemCategoryId = '';
    itemPurchaseDate = new Date();
    categoryOptions = [];
  }

  function handleEditItemSuccess() {
    shouldRefreshItem = true;
    editItemDrawerOpen = false;
  }

  // Watch for item drawer close and refresh when it closes
  let prevEditItemDrawerOpen = $state(false);
  $effect(() => {
    if (prevEditItemDrawerOpen && !editItemDrawerOpen && shouldRefreshItem) {
      // Drawer just closed, use microtask to wait for DOM updates, then wait for animation
      Promise.resolve().then(() => {
        // Wait for CSS transition to complete (typically 300ms for drawer)
        // Use requestAnimationFrame to ensure we're after the browser's paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Additional frame to ensure transition has started
            requestAnimationFrame(async () => {
              await getBudget(params.uuid).refresh();
              itemToEdit = null;
              itemName = '';
              itemAmount = '';
              itemCategoryId = '';
              itemPurchaseDate = new Date();
              categoryOptions = [];
              shouldRefreshItem = false;
            });
          });
        });
      });
    }
    prevEditItemDrawerOpen = editItemDrawerOpen;
  });

  onMount(() => {
    getBudget(params.uuid).refresh();
  });
</script>

<div class="min-h-screen bg-neutral-50 pb-6 dark:bg-neutral-900">
  <header
    class="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95"
  >
    <div class="flex items-center gap-3 px-4 py-4">
      <Button
        color="alternative"
        size="sm"
        outline
        class="border-none p-2"
        onclick={() => goto(Route.budgets)}
        aria-label="Back to budgets"
      >
        <ArrowLeftOutline class="text-primary-900 dark:text-primary-200 h-5 w-5" />
      </Button>
      <div class="min-w-0 flex-1">
        {#if budget}
          <P size="2xl" class="text-primary-900 dark:text-primary-200 truncate font-bold">
            {budget.name}
          </P>
        {:else}
          <P size="2xl" class="text-primary-900 dark:text-primary-200 font-bold">Budget Not Found</P
          >
        {/if}
      </div>
      {#if budget}
        <div class="flex items-center gap-2">
          <EditIcon onclick={handleEditClick} disabled={false} ariaLabel="Edit budget" />
          <DeleteIcon
            onclick={handleDeleteBudgetClick}
            disabled={false}
            ariaLabel="Delete budget"
          />
        </div>
      {/if}
    </div>
  </header>

  {#if budget}
    <main class="px-4 py-4">
      <div class="mb-8 border-b border-neutral-200 pb-8 dark:border-neutral-800">
        <div class="mb-6">
          <div class="mb-4 flex items-baseline justify-start gap-4">
            <P size="base" class="text-neutral-600 dark:text-neutral-400">Budget Limit</P>
            <P size="3xl" class="text-primary-900 dark:text-primary-200 font-bold">
              {formatCurrency(budgetLimit)}
            </P>
          </div>
          <Progressbar
            progress={details.progress}
            color={progressColor()}
            class="h-3"
            style={details.isOverBudget ? 'background-color: rgb(239 68 68);' : ''}
          />
        </div>

        <div class="full flex justify-between">
          <div>
            <P size="base" class="mb-2 text-neutral-600 dark:text-neutral-400">Spent</P>
            <P size="2xl" class="font-bold text-green-600 dark:text-green-400">
              {formatCurrency(budgetSpent)}
            </P>
          </div>
          <div>
            <P size="base" class="mb-2 text-neutral-600 dark:text-neutral-400">
              {details.isOverBudget ? 'Over Budget' : 'Remaining'}
            </P>
            <P
              size="2xl"
              class="font-bold {details.isOverBudget
                ? 'text-red-600 dark:text-red-400'
                : details.isWithin20Percent
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'}"
            >
              {#if details.isOverBudget}
                by {formatCurrency(Math.abs(details.remaining))}
              {:else}
                {formatCurrency(details.remaining)}
              {/if}
            </P>
          </div>
        </div>
      </div>
      {#if budget.categories.length > 0}
        <div class="mb-6">
          <div class="mb-3 flex items-center justify-between gap-2">
            <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">Categories</P>
            <Button
              color="alternative"
              size="sm"
              outline
              class="border-none p-2"
              onclick={() => (showCategoryFilters = !showCategoryFilters)}
              aria-label="Toggle category filters"
            >
              <AdjustmentsHorizontalOutline
                class="text-primary-900 dark:text-primary-200 h-4 w-4"
              />
            </Button>
          </div>

          {#if showCategoryFilters}
            <div
              class="mb-4 space-y-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <Search
                clearable
                placeholder="Search categories..."
                bind:value={categorySearchQuery}
                class="w-full"
              />
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select
                  size="sm"
                  items={[
                    { value: 'title-a-z', name: 'Title A-Z' },
                    { value: 'title-z-a', name: 'Title Z-A' },
                    { value: 'recently-used', name: 'Recently Used' },
                    { value: 'amount-low-high', name: 'Amount Low-High' },
                    { value: 'amount-high-low', name: 'Amount High-Low' },
                  ]}
                  bind:value={categorySortBy}
                  class="w-full"
                />
                <Select
                  size="sm"
                  items={[
                    { value: 'all', name: 'All' },
                    { value: 'over', name: 'Over Budget' },
                    { value: 'near', name: 'Near Limit' },
                    { value: 'good', name: 'Good' },
                  ]}
                  bind:value={categoryFilterStatus}
                  class="w-full"
                />
              </div>
            </div>
          {/if}
          <div class="space-y-2">
            {#if filteredCategories().length > 0}
              {#each filteredCategories() as category (category.uuid)}
                {@const categorySpent = category.categorySpent}
                {@const categoryRemaining = category.limit - categorySpent}
                {@const categoryOverAmount = categorySpent - category.limit}
                {@const categoryProgress = Math.min(
                  category.limit > 0 ? (categorySpent / category.limit) * 100 : 0,
                  100,
                )}
                {@const isOverLimit = category.isOverLimit}
                {@const isNearLimit = category.isNearLimit}
                {@const categoryItemCount = budget.budgetItems.filter(
                  (item) => item.categoryId === category.uuid,
                ).length}
                <div
                  class="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-colors active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:active:bg-neutral-700"
                  role="button"
                  tabindex="0"
                  onclick={(e) => {
                    // Don't navigate if clicking on the delete or edit button
                    const target = e.target as HTMLElement;
                    if (!target.closest('.delete-btn') && !target.closest('.edit-btn')) {
                      goto(Route.category_purchases(params.uuid, category.uuid));
                    }
                  }}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goto(Route.category_purchases(params.uuid, category.uuid));
                    }
                  }}
                >
                  <div class="mb-2 flex items-center justify-between">
                    <P size="base" class="text-primary-900 dark:text-primary-200 font-semibold">
                      {category.name}
                    </P>
                    <div class="flex items-center gap-2">
                      <P size="base" class="text-neutral-500 dark:text-neutral-400">
                        {formatCurrency(categorySpent)} / {formatCurrency(category.limit)}
                      </P>
                      <EditIcon
                        onclick={(e: MouseEvent) => handleEditCategoryClick(category, e)}
                        disabled={isUpdatingCategory}
                        ariaLabel="Edit category"
                      />
                      <DeleteIcon
                        onclick={(e: MouseEvent) => handleDeleteCategoryClick(category, e)}
                        disabled={isDeletingCategory}
                        ariaLabel="Delete category"
                      />
                    </div>
                  </div>
                  <Progressbar
                    progress={categoryProgress}
                    color={isOverLimit ? 'red' : isNearLimit ? 'yellow' : 'green'}
                    class="mb-2"
                    style={isOverLimit ? 'background-color: rgb(239 68 68);' : ''}
                  />
                  <div class="flex items-center justify-between pt-2">
                    <div class="flex items-center gap-1.5">
                      <div class="bg-accent-500 dark:bg-accent-400 h-2 w-2 rounded-full"></div>
                      <span class="text-base text-neutral-600 dark:text-neutral-400">
                        {categoryItemCount}
                        {categoryItemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <P
                      size="sm"
                      class="text-right {isOverLimit
                        ? 'text-red-600 dark:text-red-400'
                        : isNearLimit
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'}"
                    >
                      {#if isOverLimit}
                        Over by {formatCurrency(categoryOverAmount)}
                      {:else}
                        {formatCurrency(categoryRemaining)} remaining
                      {/if}
                    </P>
                  </div>
                </div>
              {/each}
            {:else}
              <div
                class="rounded-lg border border-neutral-200 bg-white p-4 text-center dark:border-neutral-700 dark:bg-neutral-800"
              >
                <P size="base" class="text-neutral-500 dark:text-neutral-400">
                  No categories match the selected filter
                </P>
              </div>
            {/if}
          </div>
        </div>
      {/if}
      <div>
        <div class="mb-3 flex items-center justify-between gap-2">
          <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">
            Purchases
            {#if filteredPurchases().length !== budget.budgetItems.length}
              <span class="ml-2 text-base font-normal text-neutral-500 dark:text-neutral-400">
                ({filteredPurchases().length} of {budget.budgetItems.length})
              </span>
            {/if}
          </P>
          <Button
            color="alternative"
            size="sm"
            outline
            class="border-none p-2"
            onclick={() => (showFilters = !showFilters)}
            aria-label="Toggle filters"
          >
            <AdjustmentsHorizontalOutline class="text-primary-900 dark:text-primary-200 h-4 w-4" />
          </Button>
        </div>
        {#if showFilters}
          <div
            class="mb-4 space-y-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <Search
              clearable
              placeholder="Search purchases..."
              bind:value={searchQuery}
              class="w-full"
            />
            <MultiSelect
              items={categoryFilterOptions()}
              bind:value={selectedCategoryFilters}
              placeholder="Select categories..."
              class="w-full"
            />
          </div>
        {/if}

        {#if budget.budgetItems.length > 0}
          {#if filteredPurchases().length > 0}
            <div class="space-y-2">
              {#each filteredPurchases() as item (item.uuid)}
                {@const category = getCategory(item.categoryId, budget.categories)}
                <div
                  class="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <div class="flex items-start justify-between">
                    <div class="min-w-0 flex-1">
                      <P size="base" class="text-primary-900 dark:text-primary-200 font-semibold">
                        {item.name}
                      </P>
                      <div class="mt-1 flex items-center gap-2">
                        {#if category}
                          <span
                            class="bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300 rounded-full px-2 py-0.5 text-base"
                          >
                            {category.name}
                          </span>
                        {/if}
                        <span class="text-base text-neutral-500 dark:text-neutral-400">
                          {isoStringToDate(item.purchaseDate)}
                        </span>
                      </div>
                    </div>
                    <div class="ml-3 flex items-center gap-2">
                      <P size="base" class="text-primary-900 dark:text-primary-200 font-semibold">
                        {formatCurrency(item.amount)}
                      </P>
                      <EditIcon
                        onclick={(e: MouseEvent) => handleEditItemClick(item, e)}
                        disabled={isUpdatingItem}
                        ariaLabel="Edit purchase"
                      />
                      <DeleteIcon
                        onclick={(e: MouseEvent) => handleDeleteClick(item, e)}
                        disabled={isDeleting}
                        ariaLabel="Delete purchase"
                      />
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div
              class="rounded-lg border border-neutral-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-800"
            >
              <P size="base" class="text-neutral-500 dark:text-neutral-400">
                No purchases match your search or filter criteria
              </P>
            </div>
          {/if}
        {:else}
          <div
            class="rounded-lg border border-neutral-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-800"
          >
            <P size="base" class="text-neutral-500 dark:text-neutral-400"
              >No purchases recorded yet</P
            >
          </div>
        {/if}
      </div>
    </main>
  {:else}
    <main class="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <P size="xl" class="text-primary-900 dark:text-primary-200 mb-2 font-semibold">
        Budget Not Found
      </P>
      <p class="mb-4 text-base text-neutral-600 dark:text-neutral-400">
        The budget you're looking for doesn't exist or you don't have access to it.
      </p>
      <Button color="primary" onclick={() => goto(Route.budgets)}>Back to Budgets</Button>
    </main>
  {/if}

  <Modal title="Delete Purchase" bind:open={deleteModalOpen} autoclose>
    <P size="xl">Are you sure you want to delete this purchase?</P>
    <P class="text-primary-900 dark:text-primary-200 font-semibold">
      {itemToDelete?.name}
    </P>
    <P size="base" class="mt-2 text-neutral-600 dark:text-neutral-400">
      This action cannot be undone.
    </P>

    {#snippet footer()}
      <div class="flex w-full justify-between gap-4">
        <Button onclick={handleDeleteCancel} color="alternative" disabled={isDeleting}>
          Cancel
        </Button>
        <form
          {...deleteBudgetItem.enhance(async ({ form, submit }) => {
            isDeleting = true;
            try {
              await submit();

              if (deleteBudgetItem.result?.success === true) {
                form.reset();
                await handleDeleteSuccess();
              }
            } catch (error) {
              console.error('Error deleting purchase:', error);
            } finally {
              isDeleting = false;
            }
          })}
        >
          <input type="hidden" name="budgetItemId" value={itemToDelete?.uuid || ''} />
          <Button color="red" type="submit" disabled={isDeleting || !itemToDelete}>Delete</Button>
        </form>
      </div>
    {/snippet}
  </Modal>

  <Modal title="Delete Category" bind:open={deleteCategoryModalOpen} autoclose>
    <P size="xl">Are you sure you want to delete this category?</P>
    <P class="text-primary-900 dark:text-primary-200 font-semibold">
      {categoryToDelete?.name}
    </P>
    {#if categoryToDelete && budget}
      {@const categoryUuid = categoryToDelete.uuid}
      {@const itemCount = budget.budgetItems.filter(
        (item) => item.categoryId === categoryUuid,
      ).length}
      {#if itemCount > 0}
        <P size="base" class="mt-2 text-yellow-600 dark:text-yellow-400">
          Warning: This category has {itemCount}
          {itemCount === 1 ? 'purchase' : 'purchases'}. All purchases in this category will also be
          deleted.
        </P>
      {/if}
    {/if}
    <P size="base" class="mt-2 text-neutral-600 dark:text-neutral-400">
      This action cannot be undone.
    </P>

    {#snippet footer()}
      <div class="flex w-full justify-between gap-4">
        <Button
          onclick={handleDeleteCategoryCancel}
          color="alternative"
          disabled={isDeletingCategory}
        >
          Cancel
        </Button>
        <form
          {...deleteCategory.enhance(async ({ form, submit }) => {
            isDeletingCategory = true;
            try {
              await submit();

              if (deleteCategory.result?.success === true) {
                form.reset();
                await handleDeleteCategorySuccess();
              }
            } catch (error) {
              console.error('Error deleting category:', error);
            } finally {
              isDeletingCategory = false;
            }
          })}
        >
          <input type="hidden" name="categoryId" value={categoryToDelete?.uuid || ''} />
          <Button color="red" type="submit" disabled={isDeletingCategory || !categoryToDelete}>
            Delete
          </Button>
        </form>
      </div>
    {/snippet}
  </Modal>

  {#if budget}
    <EditBudgetDrawer
      bind:open={editDrawerOpen}
      budgetId={budget.uuid}
      initialName={budget.name}
      onSuccess={handleEditSuccess}
      onCancel={handleEditCancel}
    />
    <DeleteBudgetModal
      bind:open={deleteBudgetModalOpen}
      budgetId={budget.uuid}
      budgetName={budget.name}
      onSuccess={handleDeleteBudgetSuccess}
      onCancel={handleDeleteBudgetCancel}
    />
  {/if}

  <Drawer bind:open={editCategoryDrawerOpen} placement="bottom" class="z-50">
    <div class="flex max-h-[90vh] w-full flex-col bg-white dark:bg-neutral-800">
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
      >
        <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">Edit Category</P>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-4 py-4">
        <form
          {...updateCategory.enhance(async ({ form, submit }) => {
            isUpdatingCategory = true;
            try {
              await submit();

              if (updateCategory.result?.success === true) {
                form.reset();
                await handleEditCategorySuccess();
              }
            } catch (error) {
              console.error('Error updating category:', error);
            } finally {
              isUpdatingCategory = false;
            }
          })}
          class="space-y-4"
        >
          <input type="hidden" name="categoryId" value={categoryToEdit?.uuid || ''} />
          <div>
            <label
              for="category-name"
              class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
            >
              Category Name
            </label>
            <Input
              id="category-name"
              name="name"
              bind:value={categoryName}
              placeholder="Enter category name"
              required
              disabled={isUpdatingCategory}
              class="w-full"
            />
          </div>
          <div>
            <label
              for="category-limit"
              class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
            >
              Monthly Limit ($)
            </label>
            <Input
              id="category-limit"
              name="limit"
              type="number"
              step="0.01"
              min="0"
              bind:value={categoryLimit}
              placeholder="500.00"
              required
              disabled={isUpdatingCategory}
              class="w-full"
            />
          </div>

          <div class="flex w-full justify-between gap-4 pt-4">
            <Button
              onclick={handleEditCategoryCancel}
              color="alternative"
              disabled={isUpdatingCategory}
              class="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={isUpdatingCategory ||
                !categoryName.trim() ||
                !String(categoryLimit || '').trim()}
              class="flex-1"
            >
              {isUpdatingCategory ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </Drawer>

  <Drawer bind:open={editItemDrawerOpen} placement="bottom" class="z-50">
    <div class="flex max-h-[90vh] w-full flex-col bg-white dark:bg-neutral-800">
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
      >
        <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">Edit Purchase</P>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-4 py-4">
        <form
          {...updateBudgetItem.enhance(async ({ form, submit }) => {
            isUpdatingItem = true;
            try {
              await submit();

              if (updateBudgetItem.result?.success === true) {
                form.reset();
                await handleEditItemSuccess();
              }
            } catch (error) {
              console.error('Error updating purchase:', error);
            } finally {
              isUpdatingItem = false;
            }
          })}
          class="space-y-4"
        >
          <input type="hidden" name="budgetItemId" value={itemToEdit?.uuid || ''} />
          <input type="hidden" name="purchaseDate" value={itemPurchaseDate.toISOString()} />
          <div>
            <label
              for="item-name"
              class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
            >
              Purchase Name
            </label>
            <Input
              id="item-name"
              name="name"
              bind:value={itemName}
              placeholder="e.g., Milk"
              required
              disabled={isUpdatingItem}
              class="w-full"
            />
          </div>
          <div>
            <label
              for="item-date"
              class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
            >
              Date
            </label>
            <Datepicker
              id="item-date"
              inputClass="text-xl h-12"
              color="primary"
              bind:value={itemPurchaseDate}
              autohide
              disabled={isUpdatingItem}
            />
          </div>
          <div>
            <label
              for="item-category"
              class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
            >
              Category
            </label>
            <Select
              id="item-category"
              name="categoryId"
              size="lg"
              classes={{ select: 'h-12 truncate text-xl' }}
              items={categoryOptions}
              bind:value={itemCategoryId}
              disabled={categoryOptions.length === 0 || isUpdatingItem}
              placeholder="Select a category"
              required
            />
          </div>
          <div>
            <label
              for="item-amount"
              class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
            >
              Amount ($)
            </label>
            <Input
              id="item-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              bind:value={itemAmount}
              placeholder="5.00"
              required
              disabled={isUpdatingItem}
              class="w-full"
            />
          </div>

          <div class="flex w-full justify-between gap-4 pt-4">
            <Button
              onclick={handleEditItemCancel}
              color="alternative"
              disabled={isUpdatingItem}
              class="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={isUpdatingItem ||
                !itemName.trim() ||
                !String(itemAmount || '').trim() ||
                !itemCategoryId}
              class="flex-1"
            >
              {isUpdatingItem ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </Drawer>
</div>
