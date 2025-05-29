<script lang="ts">
  import { enhance } from '$app/forms';
  import ListItem from '$lib/components/ListItem.svelte';
  import { Route } from '$lib/constants/routes';
  import type { Budget } from '$lib/server/db/schema';
  import { Button, Input, P, Search } from 'flowbite-svelte';
  import { CloseOutline } from 'flowbite-svelte-icons';
  import BudgetView from './components/BudgetView.svelte';
  import BudgetFormsView from './components/BudgetFormsView.svelte';
  let { data } = $props();
  let name = $state('');
  let search = $state('');
  let displayBudgets = $derived(data.budgets.filter((budget) => budget.name.includes(search)));
  let selectedBudget = $state<Budget>();
</script>

<div class="@container flex gap-4 p-4">
  <div class="flex flex-col gap-4 @max-[900px]:w-full dark:border-neutral-700">
    <Search clearable clearableOnClick={() => (search = '')} bind:value={search} />
    <div
      class="flex h-[calc(100vh-15rem)] flex-col rounded-lg bg-neutral-400 p-4 @min-[900px]:w-sm dark:border-neutral-700 dark:bg-neutral-600"
    >
      <div class="mb-4 flex flex-col gap-4">
        <P size="2xl" class="text-primary-900 dark:text-primary-200">Budgets</P>
        <hr class="border-primary-700 dark:border-primary-200" />
      </div>
      <div class="flex flex-1 flex-col gap-2 overflow-y-auto">
        {#each displayBudgets as budget}
          <div class="@min-[900px]:hidden">
            <ListItem
              href={Route.budget(budget.uuid)}
              isActive={selectedBudget?.uuid === budget.uuid}
            >
              <P
                class="text-primary-900 dark:text-primary-200 overflow-hidden text-ellipsis whitespace-nowrap"
                >{budget.name}</P
              >
            </ListItem>
          </div>
          <div class="@max-[900px]:hidden">
            <ListItem
              onClick={() => (selectedBudget = budget)}
              isActive={selectedBudget?.uuid === budget.uuid}
            >
              <P
                class="text-primary-900 dark:text-primary-200 overflow-hidden text-ellipsis whitespace-nowrap"
                >{budget.name}</P
              >
            </ListItem>
          </div>
        {/each}
      </div>
    </div>
  </div>
  <div class="flex flex-1 flex-col gap-4 @max-[900px]:hidden">
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
