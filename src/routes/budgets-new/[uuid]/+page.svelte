<script lang="ts">
  import { Button, P, Progressbar, Search, Select } from 'flowbite-svelte';
  import { ArrowLeftOutline, AdjustmentsHorizontalOutline } from 'flowbite-svelte-icons';
  import { getBudget } from '$lib/api/budgets.remote';
  import { formatCurrency } from '$lib/utils/money';
  import { getCategoryTotalSpent, getCategory } from '$lib/helpers/budgets';
  import { isoStringToDate } from '$lib/helpers/conversions';
  import { goto } from '$app/navigation';
  import { Route } from '$lib/constants/routes';
  import type { BudgetItem } from '$lib/server/db/schema';

  let { params } = $props();

  const budget = await getBudget(params.uuid);

  // Search and filter state
  let searchQuery = $state('');
  let categorySearchQuery = $state('');
  let selectedCategoryFilter = $state<string>('all');
  let showFilters = $state(false);
  let showCategoryFilters = $state(false);

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

  // Filter categories
  const categoryFilterOptions = $derived(() => {
    if (!budget) return [];
    return [
      { value: 'all', name: 'All Categories' },
      ...budget.categories.map((cat) => ({ value: cat.uuid, name: cat.name })),
    ];
  });

  // Filter and search purchases
  const filteredPurchases = $derived((): BudgetItem[] => {
    if (!budget) return [];

    let items: BudgetItem[] = [...budget.budgetItems];

    // Filter by category
    if (selectedCategoryFilter !== 'all') {
      items = items.filter((item) => item.categoryId === selectedCategoryFilter);
    }

    // Search by name or category
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter((item) => {
        const category = getCategory(item.categoryId, budget.categories);
        return (
          item.name.toLowerCase().includes(query) || category?.name.toLowerCase().includes(query)
        );
      });
    }

    // Sort by date (newest first)
    return items.sort((a, b) => {
      return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
    });
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
    if (categorySearchQuery.trim()) {
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
</script>

<div class="min-h-screen bg-neutral-50 pb-6 dark:bg-neutral-900">
  <!-- Header -->
  <header
    class="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95"
  >
    <div class="flex items-center gap-3 px-4 py-4">
      <Button
        color="alternative"
        size="sm"
        outline
        class="border-none p-2"
        onclick={() => goto(Route.budgets_new)}
        aria-label="Back to budgets"
      >
        <ArrowLeftOutline class="text-primary-900 dark:text-primary-200 h-5 w-5" />
      </Button>
      <div class="min-w-0 flex-1">
        {#if budget}
          <P size="xl" class="text-primary-900 dark:text-primary-200 truncate font-bold">
            {budget.name}
          </P>
        {:else}
          <P size="xl" class="text-primary-900 dark:text-primary-200 font-bold">Budget Not Found</P>
        {/if}
      </div>
    </div>
  </header>

  {#if budget}
    <main class="px-4 py-4">
      <!-- Budget Summary Card -->
      <div
        class="mb-6 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
      >
        <div class="mb-4">
          <div class="mb-2 flex items-center justify-between">
            <P size="sm" class="text-neutral-600 dark:text-neutral-400">Budget Limit</P>
            <P size="lg" class="text-primary-900 dark:text-primary-200 font-semibold">
              {formatCurrency(budgetLimit)}
            </P>
          </div>
          <Progressbar
            progress={details.progress}
            color={progressColor()}
            class="mb-2"
            style={details.isOverBudget ? 'background-color: rgb(239 68 68);' : ''}
          />
        </div>

        <div
          class="grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4 dark:border-neutral-700"
        >
          <div>
            <P size="xs" class="mb-1 text-neutral-500 dark:text-neutral-400">Spent</P>
            <P size="lg" class="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(budgetSpent)}
            </P>
          </div>
          <div>
            <P size="xs" class="mb-1 text-neutral-500 dark:text-neutral-400">
              {details.isOverBudget ? 'Over Budget' : 'Remaining'}
            </P>
            <P
              size="lg"
              class="font-semibold {details.isOverBudget
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

      <!-- Categories Section -->
      {#if budget.categories.length > 0}
        <div class="mb-6">
          <div class="mb-3 flex items-center justify-between gap-2">
            <P size="lg" class="text-primary-900 dark:text-primary-200 font-semibold">Categories</P>
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

          <!-- Search and Filter Controls -->
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
                  onclick={() => goto(Route.category_purchases(params.uuid, category.uuid))}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goto(Route.category_purchases(params.uuid, category.uuid));
                    }
                  }}
                >
                  <div class="mb-2 flex items-center justify-between">
                    <P size="sm" class="text-primary-900 dark:text-primary-200 font-semibold">
                      {category.name}
                    </P>
                    <P size="xs" class="text-neutral-500 dark:text-neutral-400">
                      {formatCurrency(categorySpent)} / {formatCurrency(category.limit)}
                    </P>
                  </div>
                  <Progressbar
                    progress={categoryProgress}
                    color={isOverLimit ? 'red' : isNearLimit ? 'yellow' : 'green'}
                    class="mb-2"
                    style={isOverLimit ? 'background-color: rgb(239 68 68);' : ''}
                  />
                  <div
                    class="flex items-center justify-between border-t border-neutral-200 pt-2 dark:border-neutral-700"
                  >
                    <div class="flex items-center gap-1.5">
                      <div class="bg-accent-500 dark:bg-accent-400 h-2 w-2 rounded-full"></div>
                      <span class="text-xs text-neutral-600 dark:text-neutral-400">
                        {categoryItemCount}
                        {categoryItemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <P
                      size="xs"
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
                <P size="sm" class="text-neutral-500 dark:text-neutral-400">
                  No categories match the selected filter
                </P>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Purchases Section -->
      <div>
        <div class="mb-3 flex items-center justify-between gap-2">
          <P size="lg" class="text-primary-900 dark:text-primary-200 font-semibold">
            Purchases
            {#if filteredPurchases().length !== budget.budgetItems.length}
              <span class="ml-2 text-sm font-normal text-neutral-500 dark:text-neutral-400">
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

        <!-- Search and Filter Controls -->
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
            <Select
              size="sm"
              items={categoryFilterOptions()}
              bind:value={selectedCategoryFilter}
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
                      <P size="sm" class="text-primary-900 dark:text-primary-200 font-semibold">
                        {item.name}
                      </P>
                      <div class="mt-1 flex items-center gap-2">
                        {#if category}
                          <span
                            class="bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300 rounded-full px-2 py-0.5 text-xs"
                          >
                            {category.name}
                          </span>
                        {/if}
                        <span class="text-xs text-neutral-500 dark:text-neutral-400">
                          {isoStringToDate(item.purchaseDate)}
                        </span>
                      </div>
                    </div>
                    <P size="sm" class="text-primary-900 dark:text-primary-200 ml-3 font-semibold">
                      {formatCurrency(item.amount)}
                    </P>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div
              class="rounded-lg border border-neutral-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-800"
            >
              <P size="sm" class="text-neutral-500 dark:text-neutral-400">
                No purchases match your search or filter criteria
              </P>
            </div>
          {/if}
        {:else}
          <div
            class="rounded-lg border border-neutral-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-800"
          >
            <P size="sm" class="text-neutral-500 dark:text-neutral-400">No purchases recorded yet</P
            >
          </div>
        {/if}
      </div>
    </main>
  {:else}
    <main class="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <P size="lg" class="text-primary-900 dark:text-primary-200 mb-2 font-semibold">
        Budget Not Found
      </P>
      <p class="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
        The budget you're looking for doesn't exist or you don't have access to it.
      </p>
      <Button color="primary" onclick={() => goto(Route.budgets_new)}>Back to Budgets</Button>
    </main>
  {/if}
</div>
