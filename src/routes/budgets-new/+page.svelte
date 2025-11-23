<script lang="ts">
  import { Button, P, Select, Modal } from 'flowbite-svelte';
  import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import { getBudgets, deleteBudget } from '$lib/api/budgets.remote';
  import { goto } from '$app/navigation';
  import { Route } from '$lib/constants/routes';
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import { formatCurrency } from '$lib/utils/money';
  import { enhance } from '$app/forms';
  import AddItemDrawer from './components/AddItemDrawer.svelte';

  const budgetsQuery = getBudgets();
  const budgets = $derived(await budgetsQuery);

  let drawerOpen = $state(false);
  let deleteModalOpen = $state(false);
  let budgetToDelete = $state<BudgetWithRelations | null>(null);
  let isDeleting = $state(false);

  type SortOption =
    | 'created-date'
    | 'recently-used'
    | 'title-a-z'
    | 'title-z-a'
    | 'amount-low-high'
    | 'amount-high-low';

  let sortBy = $state<SortOption>('created-date');

  function handleCreateBudget() {
    drawerOpen = true;
  }

  function handleBudgetClick(budgetId: string) {
    goto(Route.budget_new(budgetId));
  }

  function handleDeleteClick(budget: BudgetWithRelations, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    budgetToDelete = budget;
    deleteModalOpen = true;
  }

  function handleDeleteCancel() {
    deleteModalOpen = false;
    budgetToDelete = null;
  }

  async function handleDeleteSuccess() {
    await budgetsQuery.refresh();
    deleteModalOpen = false;
    budgetToDelete = null;
  }

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
  <!-- Header -->
  <header
    class="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95"
  >
    <div class="px-4 py-4">
      <div class="mb-3 flex items-center justify-between">
        <P size="2xl" class="text-primary-900 dark:text-primary-200 font-bold">My Budgets</P>
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
      <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {budgets.length === 0
          ? 'No budgets yet'
          : `${budgets.length} ${budgets.length === 1 ? 'budget' : 'budgets'}`}
      </p>
    </div>
  </header>

  <!-- Budgets List -->
  <main class="px-4 py-4">
    {#if budgets.length === 0}
      <!-- Empty State -->
      <div class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div class="bg-primary-100 dark:bg-primary-900/30 mb-6 rounded-full p-6">
          <PlusOutline class="text-primary-600 dark:text-primary-400 h-12 w-12" />
        </div>
        <P size="xl" class="text-primary-900 dark:text-primary-200 mb-2 font-semibold">
          Create Your First Budget
        </P>
        <p class="mb-6 max-w-xs text-sm text-neutral-600 dark:text-neutral-400">
          Start tracking your expenses and managing your finances with a new budget.
        </p>
        <Button color="primary" size="lg" class="w-full max-w-xs" onclick={handleCreateBudget}>
          <PlusOutline class="mr-2" />
          Create Budget
        </Button>
      </div>
    {:else}
      <!-- Budget Cards -->
      <div class="space-y-3">
        {#each sortedBudgets() as budget (budget.uuid)}
          {@const budgetAmount = getBudgetAmount(budget)}
          {@const budgetSpent = getBudgetSpent(budget)}
          {@const budgetRemaining = getBudgetRemaining(budget)}
          {@const isOverBudget = budgetSpent > budgetAmount}
          <div
            class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-colors active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:active:bg-neutral-700"
            role="button"
            tabindex="0"
            onclick={() => handleBudgetClick(budget.uuid)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBudgetClick(budget.uuid);
              }
            }}
          >
            <div class="mb-3 flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <P size="lg" class="text-primary-900 dark:text-primary-200 truncate font-semibold">
                  {budget.name}
                </P>
                <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Created {new Date(budget.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <Button
                color="red"
                size="xs"
                outline
                class="ml-2 flex-shrink-0 border-red-600 p-2 hover:bg-red-50 dark:border-red-400 dark:hover:bg-red-900/20"
                onclick={(e: MouseEvent) => handleDeleteClick(budget, e)}
                disabled={isDeleting}
                aria-label="Delete budget"
              >
                <TrashBinOutline class="h-4 w-4 text-red-600 dark:text-red-400" />
              </Button>
            </div>

            <!-- Budget Amount Info -->
            <div
              class="mb-3 grid grid-cols-2 gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-700"
            >
              <div>
                <P size="xs" class="mb-1 text-neutral-500 dark:text-neutral-400">Budget Limit</P>
                <P size="sm" class="text-primary-900 dark:text-primary-200 font-semibold">
                  {formatCurrency(budgetAmount)}
                </P>
              </div>
              <div>
                <P size="xs" class="mb-1 text-neutral-500 dark:text-neutral-400">
                  {isOverBudget ? 'Over Budget' : 'Remaining'}
                </P>
                <P
                  size="sm"
                  class="font-semibold {isOverBudget
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'}"
                >
                  {#if isOverBudget}
                    by {formatCurrency(Math.abs(budgetRemaining))}
                  {:else}
                    {formatCurrency(budgetRemaining)}
                  {/if}
                </P>
              </div>
            </div>

            <div
              class="flex items-center gap-4 border-t border-neutral-200 pt-3 dark:border-neutral-700"
            >
              <div class="flex items-center gap-1.5">
                <div class="bg-secondary-500 dark:bg-secondary-400 h-2 w-2 rounded-full"></div>
                <span class="text-sm text-neutral-600 dark:text-neutral-400">
                  {budget.categories.length}
                  {budget.categories.length === 1 ? 'category' : 'categories'}
                </span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="bg-accent-500 dark:bg-accent-400 h-2 w-2 rounded-full"></div>
                <span class="text-sm text-neutral-600 dark:text-neutral-400">
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

  <!-- Floating Action Button -->
  {#if budgets.length > 0}
    <div class="fixed right-4 bottom-6 z-20">
      <Button
        color="primary"
        size="xl"
        pill
        class="h-14 w-14 shadow-lg transition-shadow hover:shadow-xl"
        onclick={handleCreateBudget}
        aria-label="Create new budget"
      >
        <PlusOutline class="h-6 w-6" />
      </Button>
    </div>
  {/if}

  <AddItemDrawer bind:open={drawerOpen} />

  <!-- Delete Confirmation Modal -->
  <Modal title="Delete Budget" bind:open={deleteModalOpen} autoclose>
    <P size="lg">Are you sure you want to delete this budget?</P>
    <P class="text-primary-900 dark:text-primary-200 font-semibold">
      {budgetToDelete?.name}
    </P>
    <P size="sm" class="mt-2 text-neutral-600 dark:text-neutral-400">
      This action cannot be undone. All categories and purchases in this budget will be deleted.
    </P>

    {#snippet footer()}
      <div class="flex w-full justify-between gap-4">
        <Button onclick={handleDeleteCancel} color="alternative" disabled={isDeleting}>
          Cancel
        </Button>
        <form
          {...deleteBudget}
          use:enhance={() => {
            isDeleting = true;
            return async ({ result, update: _update }) => {
              isDeleting = false;
              if (result.type === 'success') {
                await handleDeleteSuccess();
              } else if (result.type === 'failure') {
                const errorData = result.data as { error?: { message?: string } } | undefined;
                console.error('Failed to delete budget:', errorData?.error?.message);
              } else if (result.type === 'error') {
                console.error('Error deleting budget:', result.error?.message);
              }
              // Don't call update() - we're handling refresh manually via budgetsQuery.refresh()
            };
          }}
        >
          <input type="hidden" name="budgetId" value={budgetToDelete?.uuid || ''} />
          <Button color="red" type="submit" disabled={isDeleting || !budgetToDelete}>Delete</Button>
        </form>
      </div>
    {/snippet}
  </Modal>
</div>
