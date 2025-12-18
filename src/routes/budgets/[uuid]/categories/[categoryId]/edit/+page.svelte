<script lang="ts">
  import { Button, P, Label } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import Input from '$lib/components/Input.svelte';
  import {
    updateCategory,
    getCategoryPurchases,
    getBudget,
    getCategories,
  } from '$lib/api/budgets.remote';
  import { goto } from '$app/navigation';
  import { Route } from '$lib/constants/routes';
  import { centsToDollars } from '$lib/utils/money';
  import { page } from '$app/state';

  let { params } = $props();

  // Get the "from" query parameter to know where to navigate back to
  const fromUrl = $derived(
    page.url.searchParams.get('from') || Route.category_purchases(params.uuid, params.categoryId),
  );

  const categoryData = $derived(
    await getCategoryPurchases({
      categoryId: params.categoryId,
      budgetId: params.uuid,
    }),
  );

  // Compute initial values reactively from categoryData
  const initialName = $derived(categoryData?.category?.name ?? '');
  const initialLimit = $derived(
    categoryData?.category ? centsToDollars(categoryData.category.limit).toString() : '',
  );

  // let categoryName = $state('');
  // let categoryLimit = $state('');
  let isSubmitting = $state(false);

  // Reactively update state when initial values change (for form validation)
  // $effect(() => {
  //   categoryName = initialName;
  //   categoryLimit = initialLimit;
  // });

  function handleCancel() {
    goto(fromUrl);
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
        onclick={handleCancel}
        aria-label="Back to category"
      >
        <ArrowLeftOutline class="text-primary-900 dark:text-primary-200 h-5 w-5" />
      </Button>
      <div class="min-w-0 flex-1">
        <P size="2xl" class="text-primary-900 dark:text-primary-200 truncate font-bold">
          Edit Category
        </P>
      </div>
    </div>
  </header>

  <!-- Content -->
  <div class="mx-auto max-w-[1244px] px-4 py-6">
    {#if categoryData?.category}
      <form
        {...updateCategory.enhance(async ({ form, submit }) => {
          isSubmitting = true;
          try {
            await submit();

            if (updateCategory.result?.success === true) {
              form.reset();
              // Refresh the category data and related budget data
              await Promise.all([
                getCategoryPurchases({
                  categoryId: params.categoryId,
                  budgetId: params.uuid,
                }).refresh(),
                getBudget(params.uuid).refresh(),
                getCategories(params.uuid).refresh(),
              ]);
              // Navigate back to where we came from
              goto(fromUrl);
            }
          } catch (error) {
            console.error('Error updating category:', error);
          } finally {
            isSubmitting = false;
          }
        })}
        class="space-y-4"
      >
        <input type="hidden" name="categoryId" value={params.categoryId} />
        <div>
          <Label
            for="category-name"
            class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
          >
            Category Name
          </Label>
          <Input
            field={updateCategory.fields.name}
            id="category-name"
            name="name"
            initialValue={initialName}
            placeholder="Enter category name"
            required
            disabled={isSubmitting}
            class="w-full text-xl"
          />
        </div>
        <div>
          <Label
            for="category-limit"
            class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
          >
            Monthly Limit ($)
          </Label>
          <Input
            field={updateCategory.fields.limit}
            id="category-limit"
            name="limit"
            type="number"
            step="0.01"
            min="0"
            initialValue={initialLimit}
            placeholder="500.00"
            required
            disabled={isSubmitting}
            class="w-full text-xl"
          />
        </div>

        <div class="flex w-full gap-4 pt-4">
          <Button onclick={handleCancel} color="alternative" disabled={isSubmitting} class="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            disabled={isSubmitting || !initialName.trim() || !String(initialLimit || '').trim()}
            class="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    {:else}
      <P class="text-neutral-600 dark:text-neutral-400">Loading category...</P>
    {/if}
  </div>
</div>
