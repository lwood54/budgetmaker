<script lang="ts">
  import CategoryBarChart from '$lib/components/CategoryBarChart.svelte';
  import type { Budget } from '$lib/server/db/schema';
  import { Accordion, AccordionItem, Button, P, Progressbar, Select } from 'flowbite-svelte';
  let { budget }: { budget: Budget } = $props();

  const fakeCategories: { name: string; uuid: string; limit: number }[] = [
    {
      name: 'groceries',
      uuid: crypto.randomUUID(),
      limit: 1200,
    },
    {
      name: 'gas',
      uuid: crypto.randomUUID(),
      limit: 450,
    },
    {
      name: 'household fixed',
      uuid: crypto.randomUUID(),
      limit: 1500,
    },
    {
      name: 'restaurants',
      uuid: crypto.randomUUID(),
      limit: 250,
    },
    {
      name: 'entertainment',
      uuid: crypto.randomUUID(),
      limit: 400,
    },
  ];

  const fakeBudgetItems = [
    {
      name: 'Kroger groceries',
      amount: 350,
      purchaseDate: new Date(),
      categoryId: fakeCategories[0].uuid,
      description: 'Groceries for the week',
      budgetId: budget.uuid,
      createdAt: new Date(),
      updatedAt: new Date(),
      uuid: crypto.randomUUID(),
    },
    {
      name: 'Gas',
      amount: 100,
      purchaseDate: new Date(),
      categoryId: fakeCategories[1].uuid,
      description: 'Gas for the week',
      budgetId: budget.uuid,
      createdAt: new Date(),
      updatedAt: new Date(),
      uuid: crypto.randomUUID(),
    },
    {
      name: 'Movie tickets',
      amount: 70,
      purchaseDate: new Date(),
      categoryId: fakeCategories[3].uuid,
      description: 'Movie tickets for the week',
      budgetId: budget.uuid,
      createdAt: new Date(),
      updatedAt: new Date(),
      uuid: crypto.randomUUID(),
    },
    {
      name: 'Cruise',
      amount: 3000,
      purchaseDate: new Date(),
      categoryId: fakeCategories[4].uuid,
      description: 'Cruise for the week',
      budgetId: budget.uuid,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const getCategoryTotalSpent = (categoryId: string) => {
    return fakeBudgetItems.reduce((acc, item) => {
      if (item.categoryId === categoryId) {
        return acc + item.amount;
      }
      return acc;
    }, 0);
  };

  const budgetLimit = $derived(fakeCategories.reduce((acc, category) => acc + category.limit, 0));
  const budgetSpent = $derived(fakeBudgetItems.reduce((acc, item) => acc + item.amount, 0));
  const details = $derived({
    remaining: budgetLimit - budgetSpent,
    progress: (budgetSpent / (budgetLimit ?? 1)) * 100,
    isOverBudget: budgetSpent > budgetLimit,
    isWithin10Percent: budgetSpent > budgetLimit * 0.8,
  });
  const progressColor = $derived(() => {
    if (details.isOverBudget) {
      return 'red';
    }
    if (details.isWithin10Percent) {
      return 'yellow';
    }
    return 'green';
  });

  const categoryOptions = $derived(
    fakeCategories.map((c) => ({
      value: c.uuid,
      name: c.name,
    })),
  );
  let selectedCategory = $state(fakeCategories[0].uuid);
  const currentCategory = $derived(() => {
    const cat = fakeCategories.find((c) => c.uuid === selectedCategory);
    if (!cat) return null;
    return {
      index: fakeCategories.findIndex((c) => c.uuid === selectedCategory),
      ...cat,
      remaining: cat.limit - getCategoryTotalSpent(cat.uuid),
      totalSpent: getCategoryTotalSpent(cat.uuid),
    };
  });

  const handleCategoryChange = (direction: 'prev' | 'next') => {
    const category = currentCategory();
    if (!category) return;
    let newIndex = category.index;
    if (newIndex === 0 && direction === 'prev') {
      newIndex = fakeCategories.length - 1;
    } else if (newIndex === fakeCategories.length - 1 && direction === 'next') {
      newIndex = 0;
    } else {
      newIndex = direction === 'prev' ? category.index - 1 : category.index + 1;
    }
    const cat = fakeCategories[newIndex];
    selectedCategory = cat.uuid;
  };
</script>

<div class="flex flex-col gap-4">
  <div class="flex flex-col gap-2">
    <P class="text-primary-900 dark:text-primary-200 text-right font-semibold" size="sm">
      Budget Limit: {budgetLimit}
    </P>
    <Progressbar progress={details.progress} color={progressColor()} />
  </div>
  <div class="flex justify-evenly gap-4 rounded-lg bg-neutral-200 p-4 dark:bg-neutral-800">
    <div class="flex flex-1 items-center justify-start gap-2">
      <P size="sm">Budget Spent:</P>
      <P size="lg" class="text-green-500 dark:text-green-400">{budgetSpent}</P>
    </div>
    <div class="flex flex-1 items-center justify-end gap-2">
      <P size="sm">Budget Remaining:</P>
      <P size="lg" class={`dark:text-${progressColor()}-500 text-${progressColor()}-500`}>
        {details.remaining}
      </P>
    </div>
  </div>
  <div class="flex flex-col justify-evenly rounded-lg bg-neutral-200 p-4 dark:bg-neutral-800">
    {#if currentCategory()}
      <CategoryBarChart
        limit={currentCategory()?.limit ?? 0}
        remaining={currentCategory()?.remaining ?? 0}
        spent={currentCategory()?.totalSpent ?? 0}
      />
      <P class="text-primary-900 dark:text-primary-200 text-center font-semibold">
        {currentCategory.name}
      </P>
    {/if}
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

  <Accordion flush>
    <AccordionItem contentClass="bg-neutral-400 dark:bg-neutral-800 rounded-lg p-4">
      {#snippet header()}
        <P class="text-primary-900 dark:text-primary-200 font-semibold" size="2xl">Purchases</P>
      {/snippet}
      {#each fakeBudgetItems as item}
        <div>
          <P>{item.name}</P>
          <P>{item.amount}</P>
          <P>{item.purchaseDate}</P>
          <P>{item.categoryId}</P>
        </div>
      {/each}
    </AccordionItem>
  </Accordion>
</div>
