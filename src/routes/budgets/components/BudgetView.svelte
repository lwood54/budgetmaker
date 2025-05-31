<script lang="ts">
  import CategoryBarChart from '$lib/components/CategoryBarChart.svelte';
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import { Accordion, AccordionItem, Button, P, Progressbar, Select } from 'flowbite-svelte';
  import AddCategory from './AddCategory.svelte';
  import AddBudgetItem from './AddBudgetItem.svelte';
  import { formatCurrency } from '$lib/utils/money';

  type _Props = {
    budget: BudgetWithRelations;
  };
  let { budget }: _Props = $props();
  let currentBudget = $state<BudgetWithRelations>();
  let selectedCategory = $state();

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
      remaining: cat.limit - getCategoryTotalSpent(cat.uuid),
      totalSpent: getCategoryTotalSpent(cat.uuid),
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

  const getCategoryTotalSpent = (categoryId: string) => {
    return budgetItems.reduce((acc, item) => {
      if (item.categoryId === categoryId) {
        return acc + item.amount;
      }
      return acc;
    }, 0);
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
      <AccordionItem contentClass="bg-neutral-400 dark:bg-neutral-800 rounded-lg p-4">
        {#snippet header()}
          <P class="text-primary-900 dark:text-primary-200 font-semibold" size="lg">Log Purchase</P>
        {/snippet}
        <AddBudgetItem budgets={[budget]} shouldHideBudgetSelect />
      </AccordionItem>
    </Accordion>
  {/if}
  <Accordion flush>
    <AccordionItem contentClass="bg-neutral-400 dark:bg-neutral-800 rounded-lg p-4">
      {#snippet header()}
        <P class="text-primary-900 dark:text-primary-200 font-semibold" size="lg">Add Category</P>
      {/snippet}
      <AddCategory budgets={[budget]} shouldHideBudgetSelect />
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
          <div class="flex justify-between">
            <Button
              color="gray"
              size="xs"
              class="rounded-full"
              onclick={() => handleCategoryChange('prev')}>Prev</Button
            >
            <Select class="w-32" items={categoryOptions} bind:value={selectedCategory} />
            <Button
              color="gray"
              size="xs"
              class="rounded-full"
              onclick={() => handleCategoryChange('next')}>Next</Button
            >
          </div>
        </div>
      </AccordionItem>
    </Accordion>
  {/if}

  {#if budgetItems.length > 0}
    <Accordion flush>
      <AccordionItem contentClass="bg-neutral-400 dark:bg-neutral-800 rounded-lg p-4">
        {#snippet header()}
          <P class="text-primary-900 dark:text-primary-200 font-semibold" size="lg">Purchases</P>
        {/snippet}
        {#each budgetItems as item}
          <div>
            <P>{item.name}</P>
            <P>{formatCurrency(item.amount)}</P>
            <P>{item.purchaseDate}</P>
            <P>{item.categoryId}</P>
          </div>
        {/each}
      </AccordionItem>
    </Accordion>
  {/if}
</div>
