<script lang="ts">
  import { Button, P, Progressbar } from 'flowbite-svelte';
  import Select from '$lib/components/Select.svelte';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';
  import EditIcon from '$lib/components/EditIcon.svelte';
  import EditBudgetDrawer from './components/EditBudgetDrawer.svelte';
  import DeleteBudgetModal from './components/DeleteBudgetModal.svelte';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import { getBudgets } from '$lib/api/budgets.remote';
  import { goto } from '$app/navigation';
  import { Route } from '$lib/constants/routes';
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import { formatCurrency } from '$lib/utils/money';
  import { onMount } from 'svelte';

  const budgets = $derived(await getBudgets());

  let deleteModalOpen = $state(false);
  let budgetToDelete = $state<BudgetWithRelations | null>(null);

  // Edit budget state
  let editDrawerOpen = $state(false);
  let budgetToEdit = $state<BudgetWithRelations | null>(null);

  type SortOption =
    | 'created-date'
    | 'recently-used'
    | 'title-a-z'
    | 'title-z-a'
    | 'amount-low-high'
    | 'amount-high-low';

  let sortBy = $state<SortOption>('created-date');

  function handleBudgetClick(budgetId: string) {
    goto(Route.budget(budgetId));
  }

  function handleDeleteClick(budget: BudgetWithRelations, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    budgetToDelete = budget;
    deleteModalOpen = true;
  }

  function handleEditClick(budget: BudgetWithRelations, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    budgetToEdit = budget;
    editDrawerOpen = true;
  }

  function handleEditSuccess() {
    getBudgets().refresh();
    editDrawerOpen = false;
    budgetToEdit = null;
  }

  function handleEditCancel() {
    editDrawerOpen = false;
    budgetToEdit = null;
  }

  function handleDeleteCancel() {
    deleteModalOpen = false;
    budgetToDelete = null;
  }

  function handleDeleteSuccess() {
    getBudgets().refresh();
    deleteModalOpen = false;
    budgetToDelete = null;
  }

  onMount(() => {
    console.log('Budgets page mounted');
    // Refresh budgets data when page is mounted to ensure fresh data
    getBudgets().refresh();
  });

  // Calculate budget total amount (sum of category limits)
  function getBudgetAmount(budget: BudgetWithRelations): number {
    return budget.categories.reduce((acc, category) => acc + category.limit, 0);
  }

  // Calculate budget spent (sum of all budget items)
  function getBudgetSpent(budget: BudgetWithRelations): number {
    return budget.budgetItems.reduce((acc, item) => acc + item.amount, 0);
  }

  // Calculate budget remaining
  function getBudgetRemaining(budget: BudgetWithRelations): number {
    return getBudgetAmount(budget) - getBudgetSpent(budget);
  }

  // Calculate budget progress percentage
  function getBudgetProgress(budgetSpent: number, budgetLimit: number): number {
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

  // Get progress color based on budget status
  function getProgressColor(budgetSpent: number, budgetLimit: number): 'green' | 'yellow' | 'red' {
    if (budgetSpent > budgetLimit) {
      return 'red';
    }
    if (budgetSpent > budgetLimit * 0.8) {
      return 'yellow';
    }
    return 'green';
  }

  // Get remaining amount color class based on budget status
  function getRemainingColorClass(isOverBudget: boolean, isWithin20Percent: boolean): string {
    if (isOverBudget) {
      return 'text-red-600 dark:text-red-400';
    }
    if (isWithin20Percent) {
      return 'text-yellow-600 dark:text-yellow-400';
    }
    return 'text-green-600 dark:text-green-400';
  }

  // Get most recent activity date (most recent purchase or updatedAt)
  function getMostRecentActivity(budget: BudgetWithRelations): Date {
    if (budget.budgetItems.length > 0) {
      const mostRecentPurchase = budget.budgetItems.reduce((latest, item) => {
        const itemDate = new Date(item.purchaseDate);
        return itemDate > latest ? itemDate : latest;
      }, new Date(0));
      return mostRecentPurchase;
    }
    return new Date(budget.updatedAt);
  }

  const sortedBudgets = $derived((): BudgetWithRelations[] => {
    const sorted = [...(budgets || [])];

    switch (sortBy) {
      case 'created-date':
        return sorted.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      case 'recently-used':
        return sorted.sort((a, b) => {
          const aRecent = getMostRecentActivity(a).getTime();
          const bRecent = getMostRecentActivity(b).getTime();
          return bRecent - aRecent;
        });

      case 'title-a-z':
        return sorted.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });

      case 'title-z-a':
        return sorted.sort((a, b) => {
          return b.name.localeCompare(a.name);
        });

      case 'amount-low-high':
        return sorted.sort((a, b) => {
          return getBudgetAmount(a) - getBudgetAmount(b);
        });

      case 'amount-high-low':
        return sorted.sort((a, b) => {
          return getBudgetAmount(b) - getBudgetAmount(a);
        });

      default:
        return sorted;
    }
  });
</script>

<div class="min-h-screen bg-neutral-50 pb-24 dark:bg-neutral-900">
  <header
    class="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95"
  >
    <div class="px-4 py-4">
      <div class="mb-3 flex items-center justify-between">
        <P size="3xl" class="text-primary-900 dark:text-primary-200 font-bold">My Budgets</P>
        {#if budgets.length > 0}
          <Select
            size="sm"
            items={[
              { value: 'created-date', name: 'Created Date' },
              { value: 'recently-used', name: 'Recently Used' },
              { value: 'title-a-z', name: 'Title A-Z' },
              { value: 'title-z-a', name: 'Title Z-A' },
              { value: 'amount-low-high', name: 'Limit Low-High' },
              { value: 'amount-high-low', name: 'Limit High-Low' },
            ]}
            bind:value={sortBy}
            class="w-40"
          />
        {/if}
      </div>
      <p class="mt-1 text-base text-neutral-600 dark:text-neutral-400">
        {budgets.length === 0
          ? 'No budgets yet'
          : `${budgets.length} ${budgets.length === 1 ? 'budget' : 'budgets'}`}
      </p>
    </div>
  </header>

  <main class="px-4 py-4">
    {#if budgets.length === 0}
      <div class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div class="bg-primary-100 dark:bg-primary-900/30 mb-6 rounded-full p-6">
          <PlusOutline class="text-primary-600 dark:text-primary-400 h-12 w-12" />
        </div>
        <P size="2xl" class="text-primary-900 dark:text-primary-200 mb-2 font-semibold">
          Create Your First Budget
        </P>
        <p class="mb-6 max-w-xs text-base text-neutral-600 dark:text-neutral-400">
          Start tracking your expenses and managing your finances with a new budget.
        </p>
        <Button color="primary" size="lg" class="w-full max-w-xs">
          <PlusOutline class="mr-2" />
          Create Budget
        </Button>
      </div>
    {:else}
      <div class="cursor-pointer space-y-3" data-testid="budgets-list">
        {#each sortedBudgets() as budget (budget.uuid)}
          {@const budgetAmount = getBudgetAmount(budget)}
          {@const budgetSpent = getBudgetSpent(budget)}
          {@const budgetRemaining = getBudgetRemaining(budget)}
          {@const isOverBudget = budgetSpent > budgetAmount}
          {@const budgetProgress = getBudgetProgress(budgetSpent, budgetAmount)}
          {@const progressColor = getProgressColor(budgetSpent, budgetAmount)}
          {@const isWithin20Percent = budgetSpent > budgetAmount * 0.8}
          <div
            class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-colors active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:active:bg-neutral-700"
            role="button"
            tabindex="0"
            onclick={(e) => {
              // Don't navigate if clicking on the delete or edit button
              const target = e.target as HTMLElement;
              if (!target.closest('.delete-btn') && !target.closest('.edit-btn')) {
                handleBudgetClick(budget.uuid);
              }
            }}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBudgetClick(budget.uuid);
              }
            }}
          >
            <div class="mb-3 flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <P size="xl" class="text-primary-900 dark:text-primary-200 truncate font-semibold">
                  {budget.name}
                </P>
                <p class="mt-1 text-base text-neutral-500 dark:text-neutral-400">
                  Created {new Date(budget.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div class="ml-2 flex flex-shrink-0 items-center gap-2">
                <EditIcon
                  onclick={(e: MouseEvent) => handleEditClick(budget, e)}
                  disabled={false}
                  ariaLabel="Edit budget"
                />
                <DeleteIcon
                  onclick={(e: MouseEvent) => handleDeleteClick(budget, e)}
                  disabled={false}
                  ariaLabel="Delete budget"
                />
              </div>
            </div>
            <div
              class="mb-3 grid grid-cols-2 gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-700"
            >
              <div>
                <P size="sm" class="mb-1 text-neutral-500 dark:text-neutral-400">Budget Limit</P>
                <P size="base" class="text-primary-900 dark:text-primary-200 font-semibold">
                  {formatCurrency(budgetAmount)}
                </P>
              </div>
              <div>
                <P size="sm" class="mb-1 text-neutral-500 dark:text-neutral-400">
                  {isOverBudget ? 'Over Budget' : 'Remaining'}
                </P>
                <P
                  size="base"
                  class={`font-semibold ${getRemainingColorClass(isOverBudget, isWithin20Percent)}`}
                >
                  {#if isOverBudget}
                    Over by {formatCurrency(Math.abs(budgetRemaining))}
                  {:else}
                    {formatCurrency(budgetRemaining)}
                  {/if}
                </P>
              </div>
            </div>
            {#if budgetAmount > 0}
              <div class="mb-3">
                <Progressbar
                  progress={budgetProgress}
                  color={progressColor}
                  style={isOverBudget ? 'background-color: rgb(239 68 68);' : ''}
                />
              </div>
            {/if}

            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1.5">
                <div class="bg-secondary-500 dark:bg-secondary-400 h-2 w-2 rounded-full"></div>
                <span class="text-base text-neutral-600 dark:text-neutral-400">
                  {budget.categories.length}
                  {budget.categories.length === 1 ? 'category' : 'categories'}
                </span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="bg-accent-500 dark:bg-accent-400 h-2 w-2 rounded-full"></div>
                <span class="text-base text-neutral-600 dark:text-neutral-400">
                  {budget.budgetItems.length}
                  {budget.budgetItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>

  {#if budgetToDelete}
    <DeleteBudgetModal
      bind:open={deleteModalOpen}
      budgetId={budgetToDelete.uuid}
      budgetName={budgetToDelete.name}
      onSuccess={handleDeleteSuccess}
      onCancel={handleDeleteCancel}
    />
  {/if}

  {#if budgetToEdit}
    <EditBudgetDrawer
      bind:open={editDrawerOpen}
      budgetId={budgetToEdit.uuid}
      initialName={budgetToEdit.name}
      onSuccess={handleEditSuccess}
      onCancel={handleEditCancel}
    />
  {/if}
</div>
