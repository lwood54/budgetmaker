<script lang="ts">
  import ListItem from '$lib/components/ListItem.svelte';
  import { Route } from '$lib/constants/routes';
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import { Button, P, Search } from 'flowbite-svelte';
  import { CloseOutline, PlusOutline } from 'flowbite-svelte-icons';
  import BudgetView from './components/BudgetView.svelte';
  import BudgetFormsView from './components/BudgetFormsView.svelte';
  import BudgetRow from './components/BudgetRow.svelte';
  let { data } = $props();
  let search = $state('');
  let displayBudgets = $derived(data.budgets.filter((budget) => budget.name.includes(search)));
  let selectedBudget = $state<BudgetWithRelations>();
  let selectedBudgetDataJson = $state<string>('');
  let editBudgetId = $state<string>('');
  let deleteBudgetId = $state<string>('');
  let isAddBudget = $state(false);

  const deepCompareBudget = (
    selectedBudgetDataJson: string,
    selectedBudget?: BudgetWithRelations,
  ) => {
    const relevantData = {
      categories: selectedBudget?.categories,
      budgetItems: selectedBudget?.budgetItems,
      name: selectedBudget?.name,
      updatedAt: selectedBudget?.updatedAt,
    };

    const currentDataJson = JSON.stringify(relevantData);
    return {
      isDifferent: selectedBudgetDataJson !== currentDataJson,
      currentDataJson,
    };
  };

  $effect(() => {
    if (selectedBudget) {
      const updatedSelectedBudget = data.budgets.find((b) => b.uuid === selectedBudget?.uuid);
      if (updatedSelectedBudget) {
        const { isDifferent, currentDataJson } = deepCompareBudget(
          selectedBudgetDataJson,
          updatedSelectedBudget,
        );
        if (isDifferent) {
          selectedBudget = structuredClone(updatedSelectedBudget);
        }
        selectedBudgetDataJson = currentDataJson;
        return;
      }
      selectedBudget = undefined;
      selectedBudgetDataJson = '';
      return;
    }
    selectedBudgetDataJson = '';
  });
</script>

<div class="@container flex gap-4 p-4">
  <div class="flex flex-col gap-4 @max-[1060px]:w-full dark:border-neutral-700">
    <Search clearable clearableOnClick={() => (search = '')} bind:value={search} />
    <div
      class="flex h-[calc(100vh-15rem)] flex-col rounded-lg bg-neutral-400 p-4 @min-[1060px]:max-w-[300px] dark:border-neutral-700 dark:bg-neutral-600"
    >
      <div class="mb-4 flex flex-col gap-4">
        <div class="flex justify-between">
          <P size="2xl" class="text-primary-900 dark:text-primary-200">Budgets</P>
          <Button
            color="gray"
            pill={true}
            class="h-6 w-6 rounded-full p-4"
            size="sm"
            outline
            onclick={() => (isAddBudget = !isAddBudget)}
          >
            {#if isAddBudget}
              <CloseOutline />
            {:else}
              <PlusOutline />
            {/if}
          </Button>
        </div>
        <hr class="border-primary-700 dark:border-primary-200" />
      </div>
      <div class="flex flex-1 flex-col gap-2 overflow-y-auto">
        {#if isAddBudget}
          <BudgetRow onClose={() => (isAddBudget = false)} />
        {/if}
        {#each displayBudgets as budget}
          {@const isEdit = editBudgetId === budget.uuid}
          {@const isDelete = deleteBudgetId === budget.uuid}
          {@const onEdit = () => (editBudgetId = budget.uuid)}
          {@const onDelete = () => (deleteBudgetId = budget.uuid)}
          {@const onClose = () => {
            editBudgetId = '';
            deleteBudgetId = '';
          }}
          <div class="flex gap-2 overflow-hidden @min-[1060px]:hidden">
            <ListItem
              href={Route.budget(budget.uuid)}
              isActive={selectedBudget?.uuid === budget.uuid}
              listClass="min-w-0 flex-1"
            >
              <BudgetRow {budget} {isEdit} {isDelete} {onEdit} {onDelete} {onClose} />
            </ListItem>
          </div>
          <div class="flex gap-2 @max-[1060px]:hidden">
            <ListItem
              onClick={() => (selectedBudget = budget)}
              isActive={selectedBudget?.uuid === budget.uuid}
              listClass="min-w-0 flex-1"
            >
              <BudgetRow {budget} {isEdit} {isDelete} {onEdit} {onDelete} {onClose} />
            </ListItem>
          </div>
          <!-- 
          <div class="flex gap-2 overflow-hidden @min-[1060px]:hidden">
            <ListItem
              href={Route.budget(budget.uuid)}
              isActive={selectedBudget?.uuid === budget.uuid}
              listClass="min-w-0 flex-1"
            >
              {#if isEdit}
                <Input
                  name="name"
                  placeholder="groceries"
                  class="text-lg"
                  bind:value={editBudgetName}
                />
              {:else}
                <P
                  class="text-primary-900 dark:text-primary-200 overflow-hidden text-ellipsis whitespace-nowrap"
                  >{budget.name}</P
                >
              {/if}
            </ListItem>
            <div class="flex w-28 flex-shrink-0 gap-2">
              <EditBudgetButton {isEdit} {budget} onEdit={() => (editBudgetId = budget.uuid)} />
              <DeleteBudgetButton {isEdit} {budget} onCancel={() => (editBudgetId = '')} />
            </div>
          </div>
          <div class="flex gap-2 @max-[1060px]:hidden">
            <ListItem
              onClick={() => (selectedBudget = budget)}
              isActive={selectedBudget?.uuid === budget.uuid}
              listClass="min-w-0 flex-1"
            >
              <P
                class="text-primary-900 dark:text-primary-200 overflow-hidden text-ellipsis whitespace-nowrap"
                >{budget.name}</P
              >
            </ListItem>
            <div class="flex flex-shrink-0 gap-2">
              <EditBudgetButton {isEdit} {budget} onEdit={() => (editBudgetId = budget.uuid)} />
              <DeleteBudgetButton {isEdit} {budget} onCancel={() => (editBudgetId = '')} />
            </div>
          </div>
           -->
        {/each}
      </div>
    </div>
  </div>
  <div class="flex flex-1 flex-col gap-4 @max-[1060px]:hidden">
    <div
      class="flex h-[calc(100vh-11rem)] flex-col rounded-lg bg-neutral-400 p-4 dark:border-neutral-700 dark:bg-neutral-600"
    >
      {#if selectedBudget}
        <div class="mb-4 flex flex-col gap-4 overflow-y-auto">
          <div class="flex items-center justify-between gap-4">
            <P
              size="2xl"
              class="text-primary-900 dark:text-primary-200 w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
              >{selectedBudget.name}
            </P>
            <Button
              size="xs"
              outline
              class="border-none"
              onclick={() => (selectedBudget = undefined)}
            >
              <CloseOutline class="text-primary-900 dark:text-primary-200" />
            </Button>
          </div>
          <hr class="border-primary-700 dark:border-primary-200" />
          <BudgetView budget={selectedBudget} />
        </div>
      {:else}
        <BudgetFormsView budgets={data.budgets} />
      {/if}
    </div>
  </div>
</div>
