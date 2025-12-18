<script lang="ts">
  import { Button, P, Progressbar, Modal } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';
  import EditIcon from '$lib/components/EditIcon.svelte';
  import { getCategoryPurchases, deleteBudgetItem, deleteCategory } from '$lib/api/budgets.remote';
  import { formatCurrency } from '$lib/utils/money';
  import { isoStringToDate } from '$lib/helpers/conversions';
  import { goto } from '$app/navigation';
  import { Route } from '$lib/constants/routes';
  import { page } from '$app/state';
  import type { BudgetItem } from '$lib/server/db/schema';

  let { params } = $props();

  const categoryData = $derived(
    await getCategoryPurchases({
      categoryId: params.categoryId,
      budgetId: params.uuid,
    }),
  );

  function getCategoryProgress(categorySpent: number, categoryLimit: number) {
    if (categoryLimit > 0 && categorySpent > 0) {
      const progress = (categorySpent / categoryLimit) * 100;
      return Math.min(progress, 100);
    }
    if (categoryLimit > 0 && categorySpent === 0) {
      return 0;
    }
    return 0;
  }

  const categorySpent = $derived(
    categoryData ? categoryData.items.reduce((acc, item) => acc + item.amount, 0) : 0,
  );
  const categoryLimit = $derived(categoryData ? categoryData.category.limit : 0);
  const categoryRemaining = $derived(categoryLimit - categorySpent);
  const categoryOverAmount = $derived(categorySpent - categoryLimit);
  const isOverLimit = $derived(categorySpent > categoryLimit);
  const isNearLimit = $derived(categorySpent > categoryLimit * 0.8);
  const categoryProgress = $derived(getCategoryProgress(categorySpent, categoryLimit));

  const progressColor = $derived(() => {
    if (isOverLimit) {
      return 'red';
    }
    if (isNearLimit) {
      return 'yellow';
    }
    return 'green';
  });

  // Delete state for items
  let deleteModalOpen = $state(false);
  let itemToDelete = $state<BudgetItem | null>(null);
  let isDeleting = $state(false);

  // Delete state for category
  let deleteCategoryModalOpen = $state(false);
  let isDeletingCategory = $state(false);

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
    await getCategoryPurchases({
      categoryId: params.categoryId,
      budgetId: params.uuid,
    }).refresh();
    deleteModalOpen = false;
    itemToDelete = null;
  }

  function handleEditCategoryClick() {
    const currentUrl = page.url.pathname + page.url.search;
    goto(
      `${Route.category_edit(params.uuid, params.categoryId)}?from=${encodeURIComponent(currentUrl)}`,
    );
  }

  function handleEditItemClick(item: BudgetItem, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const currentUrl = page.url.pathname + page.url.search;
    goto(`${Route.item_edit(params.uuid, item.uuid)}?from=${encodeURIComponent(currentUrl)}`);
  }

  function handleDeleteCategoryClick() {
    deleteCategoryModalOpen = true;
  }

  function handleDeleteCategoryCancel() {
    deleteCategoryModalOpen = false;
  }

  async function handleDeleteCategorySuccess() {
    await getCategoryPurchases({
      categoryId: params.categoryId,
      budgetId: params.uuid,
    }).refresh();
    deleteCategoryModalOpen = false;
    // Navigate back to budget page after deletion
    goto(Route.budget(params.uuid));
  }
</script>

<div class="bg-neutral-50 pb-6 dark:bg-neutral-900">
  <!-- Header -->
  <header
    class="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95"
  >
    <div class="mx-auto flex max-w-[1244px] items-center gap-3 px-4 py-4">
      <Button
        color="alternative"
        size="sm"
        outline
        class="border-none p-2"
        onclick={() => goto(Route.budget(params.uuid))}
        aria-label="Back to budget"
      >
        <ArrowLeftOutline class="text-primary-900 dark:text-primary-200 h-5 w-5" />
      </Button>
      <div class="min-w-0 flex-1">
        {#if categoryData}
          <P size="2xl" class="text-primary-900 dark:text-primary-200 truncate font-bold">
            {categoryData.category.name}
          </P>
        {:else}
          <P size="2xl" class="text-primary-900 dark:text-primary-200 font-bold">
            Category Not Found
          </P>
        {/if}
      </div>
      {#if categoryData}
        <div class="flex items-center gap-2">
          <EditIcon onclick={handleEditCategoryClick} ariaLabel="Edit category" />
          <DeleteIcon
            onclick={handleDeleteCategoryClick}
            disabled={isDeletingCategory}
            ariaLabel="Delete category"
          />
        </div>
      {/if}
    </div>
  </header>

  {#if categoryData}
    <main class="mx-auto max-w-[1244px] px-4 py-4">
      <div class="mb-8 border-b border-neutral-200 pb-8 dark:border-neutral-800">
        <div class="mb-6">
          <div class="mb-4 flex items-baseline justify-start gap-4">
            <P size="base" class="text-neutral-600 dark:text-neutral-400">Category Limit</P>
            <P size="3xl" class="text-primary-900 dark:text-primary-200 font-bold">
              {formatCurrency(categoryLimit)}
            </P>
          </div>
          <Progressbar
            progress={categoryProgress}
            color={progressColor()}
            class="h-3"
            style={isOverLimit ? 'background-color: rgb(239 68 68);' : ''}
          />
        </div>

        <div class="full flex justify-between">
          <div>
            <P size="base" class="mb-2 text-neutral-600 dark:text-neutral-400">Spent</P>
            <P size="2xl" class="font-bold text-green-600 dark:text-green-400">
              {formatCurrency(categorySpent)}
            </P>
          </div>
          <div>
            <P size="base" class="mb-2 text-neutral-600 dark:text-neutral-400">
              {isOverLimit ? 'Over Budget' : 'Remaining'}
            </P>
            <P
              size="2xl"
              class="font-bold {isOverLimit
                ? 'text-red-600 dark:text-red-400'
                : isNearLimit
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'}"
            >
              {#if isOverLimit}
                by {formatCurrency(categoryOverAmount)}
              {:else}
                {formatCurrency(categoryRemaining)}
              {/if}
            </P>
          </div>
        </div>
      </div>

      <!-- Purchases List -->
      <div>
        <P size="xl" class="text-primary-900 dark:text-primary-200 mb-3 font-semibold">
          Purchases ({categoryData.items.length})
        </P>

        {#if categoryData.items.length > 0}
          <div class="space-y-2">
            {#each categoryData.items as item (item.uuid)}
              <div
                class="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
              >
                <div class="flex items-start justify-between">
                  <div class="min-w-0 flex-1">
                    <P size="base" class="text-primary-900 dark:text-primary-200 font-semibold">
                      {item.name}
                    </P>
                    <span class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {isoStringToDate(item.purchaseDate)}
                    </span>
                  </div>
                  <div class="ml-3 flex items-center gap-2">
                    <P size="base" class="text-primary-900 dark:text-primary-200 font-semibold">
                      {formatCurrency(item.amount)}
                    </P>
                    <EditIcon
                      onclick={(e: MouseEvent) => handleEditItemClick(item, e)}
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
              No purchases recorded in this category yet
            </P>
          </div>
        {/if}
      </div>
    </main>
  {:else}
    <main
      class="mx-auto flex min-h-[60vh] max-w-[1244px] flex-col items-center justify-center px-4"
    >
      <P size="xl" class="text-primary-900 dark:text-primary-200 mb-2 font-semibold">
        Category Not Found
      </P>
      <p class="mb-4 text-base text-neutral-600 dark:text-neutral-400">
        The category you're looking for doesn't exist or you don't have access to it.
      </p>
      <Button color="primary" onclick={() => goto(Route.budget(params.uuid))}>
        Back to Budget
      </Button>
    </main>
  {/if}

  <!-- Delete Confirmation Modal -->
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

  <!-- Delete Category Confirmation Modal -->
  <Modal title="Delete Category" bind:open={deleteCategoryModalOpen} autoclose>
    <P size="xl">Are you sure you want to delete this category?</P>
    {#if categoryData}
      <P class="text-primary-900 dark:text-primary-200 font-semibold">
        {categoryData.category.name}
      </P>
      {@const itemCount = categoryData.items.length}
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
          <input type="hidden" name="categoryId" value={params.categoryId} />
          <Button color="red" type="submit" disabled={isDeletingCategory || !categoryData}>
            Delete
          </Button>
        </form>
      </div>
    {/snippet}
  </Modal>
</div>
