<script lang="ts">
  import { Button, P, Label } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import Input from '$lib/components/Input.svelte';
  import Select from '$lib/components/Select.svelte';
  import { Datepicker } from 'flowbite-svelte';
  import {
    updateBudgetItem,
    getBudget,
    getCategories,
    getCategoryPurchases,
  } from '$lib/api/budgets.remote';
  import { goto } from '$app/navigation';
  import { Route } from '$lib/constants/routes';
  import { page } from '$app/state';
  import { centsToDollars } from '$lib/utils/money';

  let { params } = $props();

  // Get the "from" query parameter to know where to navigate back to
  const fromUrl = $derived(page.url.searchParams.get('from') || Route.budget(params.uuid));

  const budgetData = $derived(await getBudget(params.uuid));
  const categoriesData = $derived(await getCategories(params.uuid));

  // Find the item in the budget
  const itemData = $derived(
    budgetData?.budgetItems.find((item) => item.uuid === params.itemId) || null,
  );

  // Compute initial values reactively from itemData
  const initialName = $derived(itemData?.name ?? '');
  const initialAmount = $derived(itemData ? centsToDollars(itemData.amount).toString() : '');
  const initialCategoryId = $derived(itemData?.categoryId ?? '');
  const initialPurchaseDate = $derived(itemData ? new Date(itemData.purchaseDate) : new Date());

  // let itemName = $state('');
  // let itemAmount = $state('');
  let itemCategoryId = $state('');
  let itemPurchaseDate = $state<Date>(new Date());
  let isSubmitting = $state(false);

  const categoryOptions = $derived(
    categoriesData.map((cat) => ({
      value: cat.uuid,
      name: cat.name,
    })),
  );

  // Reactively update state when initial values change
  $effect(() => {
    // itemName = initialName;
    // itemAmount = initialAmount;
    itemCategoryId = initialCategoryId;
    itemPurchaseDate = initialPurchaseDate;
  });

  function handleCancel() {
    // Navigate back to where we came from
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
        aria-label="Back to budget"
      >
        <ArrowLeftOutline class="text-primary-900 dark:text-primary-200 h-5 w-5" />
      </Button>
      <div class="min-w-0 flex-1">
        <P size="2xl" class="text-primary-900 dark:text-primary-200 truncate font-bold">
          Edit Purchase
        </P>
      </div>
    </div>
  </header>

  <!-- Content -->
  <div class="mx-auto max-w-[1244px] px-4 py-6">
    {#if itemData && budgetData}
      <form
        {...updateBudgetItem.enhance(async ({ form, submit }) => {
          isSubmitting = true;
          try {
            await submit();

            if (updateBudgetItem.result?.success === true) {
              form.reset();
              // Refresh the budget data and related category data
              await Promise.all([
                getBudget(params.uuid).refresh(),
                getCategories(params.uuid).refresh(),
                ...(itemData?.categoryId
                  ? [
                      getCategoryPurchases({
                        categoryId: itemData.categoryId,
                        budgetId: params.uuid,
                      }).refresh(),
                    ]
                  : []),
              ]);
              // Navigate back to where we came from
              goto(fromUrl);
            }
          } catch (error) {
            console.error('Error updating purchase:', error);
          } finally {
            isSubmitting = false;
          }
        })}
        class="space-y-4"
      >
        <input type="hidden" name="budgetItemId" value={params.itemId} />
        <input type="hidden" name="purchaseDate" value={itemPurchaseDate.toISOString()} />
        <div>
          <Label
            for="item-name"
            class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
          >
            Purchase Name
          </Label>
          <Input
            field={updateBudgetItem.fields.name}
            id="item-name"
            name="name"
            initialValue={initialName}
            placeholder="e.g., Milk"
            required
            disabled={isSubmitting}
            class="w-full text-xl"
          />
        </div>
        <div>
          <Label
            for="item-date"
            class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
          >
            Date
          </Label>
          <Datepicker
            id="item-date"
            inputClass="text-xl h-12"
            color="primary"
            bind:value={itemPurchaseDate}
            autohide
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label
            for="item-category"
            class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
          >
            Category
          </Label>
          <Select
            id="item-category"
            name="categoryId"
            size="lg"
            classes={{ select: 'h-12 truncate text-xl' }}
            items={categoryOptions}
            bind:value={itemCategoryId}
            disabled={categoryOptions.length === 0 || isSubmitting}
            placeholder="Select a category"
            required
          />
        </div>
        <div>
          <Label
            for="item-amount"
            class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
          >
            Amount ($)
          </Label>
          <Input
            field={updateBudgetItem.fields.amount}
            id="item-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            initialValue={initialAmount}
            placeholder="5.00"
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
            disabled={isSubmitting ||
              !initialName.trim() ||
              !String(initialAmount || '').trim() ||
              !itemCategoryId}
            class="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    {:else if !itemData}
      <P class="text-neutral-600 dark:text-neutral-400">Purchase not found</P>
    {:else}
      <P class="text-neutral-600 dark:text-neutral-400">Loading...</P>
    {/if}
  </div>
</div>
