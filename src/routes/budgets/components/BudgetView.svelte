<script lang="ts">
  import CategoryBarChart from '$lib/components/CategoryBarChart.svelte';
  import type { BudgetItem, BudgetWithRelations } from '$lib/server/db/schema';
  import {
    Accordion,
    AccordionItem,
    Button,
    Modal,
    P,
    Progressbar,
    Select,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';
  import AddCategory from './AddCategory.svelte';
  import { formatCurrency } from '$lib/utils/money';
  import {
    ChevronDoubleLeftOutline,
    ChevronDoubleRightOutline,
    CloseOutline,
    PlusOutline,
    PenOutline,
    TrashBinOutline,
  } from 'flowbite-svelte-icons';
  import CategoryDisplay from './CategoryDisplay.svelte';
  import { getCategory, getCategoryTotalSpent } from '$lib/helpers/budgets';
  import { isoStringToDate } from '$lib/helpers/conversions';
  import BudgetItemForm from './BudgetItemForm.svelte';
  import { enhance } from '$app/forms';

  type _Props = {
    budget: BudgetWithRelations;
  };
  let { budget }: _Props = $props();
  let currentBudget = $state<BudgetWithRelations>();
  let selectedCategory = $state();
  let isAddBudgetVisible = $state(false);
  let isAddCategoryVisible = $state(false);
  let editBudgetItemId = $state('');
  let deleteBudgetItem = $state<BudgetItem>();
  let isDeleteModalOpen = $state(false);
  let isSubmitting = $state(false);

  const categories = $derived(budget.categories);
  const budgetItems = $derived(budget.budgetItems);

  const budgetLimit = $derived(categories.reduce((acc, category) => acc + category.limit, 0));
  const budgetSpent = $derived(budgetItems.reduce((acc, item) => acc + item.amount, 0));
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

  const categoryOptions = $derived(
    categories.map((c) => ({
      value: c.uuid,
      name: c.name,
    })),
  );

  const currentCategory = $derived(() => {
    const cat = categories.find((c) => c.uuid === selectedCategory);
    if (!cat) return null;
    return {
      index: categories.findIndex((c) => c.uuid === selectedCategory),
      ...cat,
      remaining: cat.limit - getCategoryTotalSpent(cat.uuid, budgetItems),
      totalSpent: getCategoryTotalSpent(cat.uuid, budgetItems),
    };
  });

  function getBudgetProgress(budgetSpent: number, budgetLimit: number) {
    if (budgetLimit > 0 && budgetSpent > 0) {
      return (budgetSpent / budgetLimit) * 100;
    }
    if (budgetLimit > 0 && budgetSpent === 0) {
      return 100;
    }
    return 0;
  }

  const handleCategoryChange = (direction: 'prev' | 'next') => {
    const category = currentCategory();
    if (!category) return;
    let newIndex = category.index;
    if (newIndex === 0 && direction === 'prev') {
      newIndex = categories.length - 1;
    } else if (newIndex === categories.length - 1 && direction === 'next') {
      newIndex = 0;
    } else {
      newIndex = direction === 'prev' ? category.index - 1 : category.index + 1;
    }
    const cat = categories[newIndex];
    selectedCategory = cat.uuid;
  };

  $effect(() => {
    if (currentBudget?.uuid !== budget.uuid) {
      currentBudget = budget;
      if (budget.categories.length > 0) {
        selectedCategory = budget.categories[0].uuid;
      }
    }
  });
</script>

<Modal title="Remove Purchase" bind:open={isDeleteModalOpen} autoclose>
  <P size="lg">Are you sure you want to delete this purchase?</P>
  <P class="text-primary-900 dark:text-primary-200 font-semibold">{deleteBudgetItem?.name}</P>

  {#snippet footer()}
    <div class="flex w-full justify-end gap-4">
      <Button
        onclick={() => {
          isDeleteModalOpen = false;
          deleteBudgetItem = undefined;
        }}
        color="alternative">Cancel</Button
      >
      <form
        action={`/budgets?/deleteBudgetItem&budgetItemUUID=${deleteBudgetItem?.uuid}`}
        use:enhance={() => {
          isSubmitting = true;
          isSubmitting = true;
          return async ({ result, update }) => {
            await update();
            isSubmitting = false;
            if (result.status?.toString().startsWith('2')) {
              isDeleteModalOpen = false;
              deleteBudgetItem = undefined;
            }
          };
        }}
        method="post"
      >
        <Button color="red" type="submit" disabled={isSubmitting}>Remove</Button>
      </form>
    </div>
  {/snippet}
</Modal>

<div class="@container flex flex-col gap-4 overflow-y-auto">
  <div class="flex flex-col gap-2">
    <P class="text-primary-900 dark:text-primary-200 text-right font-semibold" size="sm">
      Budget Limit: {formatCurrency(budgetLimit)}
    </P>
    <Progressbar progress={details.progress} color={progressColor()} />
  </div>
  <div
    class="flex flex-col justify-evenly gap-4 rounded-lg bg-neutral-200 p-4 @sm:flex-row dark:bg-neutral-800"
  >
    <div class="flex flex-1 items-center justify-start gap-2">
      <P size="sm">Spent:</P>
      <P size="lg" class="text-green-500 dark:text-green-400">{formatCurrency(budgetSpent)}</P>
    </div>
    <div class="flex flex-1 items-center justify-start gap-2 @sm:justify-end">
      <P size="sm">Remaining:</P>
      <P size="lg" class={`dark:text-${progressColor()}-500 text-${progressColor()}-500`}>
        {formatCurrency(details.remaining)}
      </P>
    </div>
  </div>
  {#if categories.length > 0}
    <Accordion flush>
      <AccordionItem contentClass="bg-neutral-400 dark:bg-neutral-800 rounded-lg p-0 pt-4">
        {#snippet header()}
          <P class="text-primary-900 dark:text-primary-200 font-semibold" size="lg">Purchases</P>
        {/snippet}
        <div class="flex justify-between pr-4">
          <P
            class="text-primary-900 dark:text-primary-200 mb-4 flex-1 text-center font-semibold"
            size="lg">{isAddBudgetVisible ? 'Add Purchase' : 'Past Purchases'}</P
          >
          <Button
            color="gray"
            pill={true}
            class="h-6 w-6 rounded-full p-4"
            size="sm"
            outline
            onclick={() => (isAddBudgetVisible = !isAddBudgetVisible)}
          >
            {#if isAddBudgetVisible}
              <CloseOutline />
            {:else}
              <PlusOutline />
            {/if}
          </Button>
        </div>
        {#if budgetItems.length > 0}
          <Table border={false}>
            <TableHead
              class="bg-primary-400 dark:bg-primary-700 text-primary-900 dark:text-primary-200"
            >
              <TableHeadCell
                ><P size="sm" class="text-primary-900 dark:text-primary-200 font-semibold">Name</P
                ></TableHeadCell
              >
              <TableHeadCell class="w-30"
                ><P size="sm" class="text-primary-900 dark:text-primary-200 font-semibold">Date</P
                ></TableHeadCell
              >
              <TableHeadCell
                ><P size="sm" class="text-primary-900 dark:text-primary-200 font-semibold"
                  >Category</P
                ></TableHeadCell
              >
              <TableHeadCell
                ><P size="sm" class="text-primary-900 dark:text-primary-200 font-semibold">Amount</P
                ></TableHeadCell
              >
              <TableHeadCell></TableHeadCell>
            </TableHead>
            <TableBody>
              {#if isAddBudgetVisible}
                <TableBodyRow>
                  <BudgetItemForm
                    budgets={[budget]}
                    isHidingBudgetSelect
                    onSuccess={() => (isAddBudgetVisible = false)}
                  />
                </TableBodyRow>
              {/if}
              {#each budgetItems as item}
                <TableBodyRow
                  class="bg-primary-200 hover:bg-primary-300 dark:bg-primary-900 dark:hover:bg-primary-800 text-secondary-600 dark:text-secondary-300"
                >
                  {#if editBudgetItemId === item.uuid}
                    <BudgetItemForm
                      budgets={[budget]}
                      budgetItem={item}
                      isHidingBudgetSelect
                      onSuccess={() => (editBudgetItemId = '')}
                    />
                  {:else}
                    <TableBodyCell class="max-w-32 flex-1"
                      ><P
                        size="lg"
                        class="text-primary-900 dark:text-primary-200 overflow-hidden font-semibold text-ellipsis whitespace-nowrap"
                        >{item.name}</P
                      ></TableBodyCell
                    >
                    <TableBodyCell class="w-30"
                      ><P
                        size="lg"
                        class="text-primary-900 dark:text-primary-200 w-30 font-semibold"
                        >{isoStringToDate(item.purchaseDate)}</P
                      ></TableBodyCell
                    >
                    <TableBodyCell class="max-w-32 flex-1"
                      ><P
                        size="lg"
                        class="text-primary-900 dark:text-primary-200 overflow-hidden font-semibold text-ellipsis whitespace-nowrap"
                        >{getCategory(item.categoryId, categories)?.name}</P
                      ></TableBodyCell
                    >
                    <TableBodyCell class="max-w-34"
                      ><P
                        size="lg"
                        class="text-primary-900 dark:text-primary-200 overflow-hidden font-semibold text-ellipsis whitespace-nowrap"
                        >{formatCurrency(item.amount)}</P
                      ></TableBodyCell
                    >
                    <TableBodyCell class="w-18">
                      <Button
                        color="gray"
                        pill={true}
                        size="xs"
                        outline
                        onclick={() => (editBudgetItemId = item.uuid)}
                        class="h-8 w-8 rounded-full border-none"
                      >
                        <PenOutline size="sm" />
                      </Button>
                      <Button
                        color="gray"
                        pill={true}
                        size="xs"
                        outline
                        onclick={() => {
                          deleteBudgetItem = item;
                          isDeleteModalOpen = true;
                        }}
                        class="h-8 w-8 rounded-full border-none"
                      >
                        <TrashBinOutline color="red" size="sm" />
                      </Button>
                    </TableBodyCell>
                  {/if}
                </TableBodyRow>
              {/each}
            </TableBody>
          </Table>
          <!-- <div class="flex flex-col">
            {#each budgetItems as item}
              <PurchaseDisplay budgetItem={item} {budget} />
            {/each}
          </div> -->
        {/if}
      </AccordionItem>
    </Accordion>
  {/if}
  <Accordion flush>
    <AccordionItem contentClass="bg-neutral-400 dark:bg-neutral-800 rounded-lg p-4">
      {#snippet header()}
        <P class="text-primary-900 dark:text-primary-200 font-semibold" size="lg">Categories</P>
      {/snippet}
      <div class="flex justify-between py-4">
        <P class="text-primary-900 dark:text-primary-200 flex-1 text-center font-semibold" size="lg"
          >{isAddCategoryVisible ? 'Add Category' : 'Categories'}</P
        >
        <Button
          color="gray"
          pill={true}
          class="h-6 w-6 rounded-full p-4"
          size="sm"
          outline
          onclick={() => (isAddCategoryVisible = !isAddCategoryVisible)}
        >
          {#if isAddCategoryVisible}
            <CloseOutline />
          {:else}
            <PlusOutline />
          {/if}
        </Button>
      </div>
      {#if isAddCategoryVisible}
        <AddCategory
          budgets={[budget]}
          shouldHideBudgetSelect
          onSuccess={() => (isAddCategoryVisible = false)}
        />
        <hr class="my-4" />
      {/if}
      {#if categories.length > 0}
        <div class="flex flex-col gap-4">
          {#each categories as category}
            <CategoryDisplay {budget} {category} shouldHideBudgetSelect />
          {/each}
        </div>
      {/if}
    </AccordionItem>
  </Accordion>
  {#if currentCategory()}
    <Accordion flush>
      <AccordionItem contentClass="bg-neutral-400 dark:bg-neutral-800 rounded-lg p-4">
        {#snippet header()}
          <P class="text-primary-900 dark:text-primary-200 font-semibold" size="lg"
            >Category Charts</P
          >
        {/snippet}
        <div
          class="@container flex flex-col justify-evenly rounded-lg bg-neutral-200 p-4 dark:bg-neutral-800"
        >
          <CategoryBarChart
            limit={currentCategory()?.limit ?? 0}
            remaining={currentCategory()?.remaining ?? 0}
            spent={currentCategory()?.totalSpent ?? 0}
          />
          <div class="flex flex-1 justify-center gap-2 @sm:justify-between">
            <div class="hidden @sm:flex">
              <Button
                color="gray"
                size="xs"
                outline
                class="w-full flex-1 rounded-full"
                onclick={() => handleCategoryChange('prev')}
              >
                <ChevronDoubleLeftOutline />
              </Button>
            </div>
            <Select
              size="lg"
              selectClass="h-12"
              class="w-32"
              items={categoryOptions}
              bind:value={selectedCategory}
            />
            <div class="hidden @sm:flex">
              <Button
                color="gray"
                size="xs"
                outline
                class="rounded-full"
                onclick={() => handleCategoryChange('next')}
              >
                <ChevronDoubleRightOutline />
              </Button>
            </div>
          </div>
        </div>
      </AccordionItem>
    </Accordion>
  {/if}
</div>
