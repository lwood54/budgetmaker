<script lang="ts">
  import { Button, P } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import AddItem from '../../../components/AddItem.svelte';
  import { getBudget, getCategories } from '$lib/api/budgets.remote';
  import { goto } from '$app/navigation';
  import { Route } from '$lib/constants/routes';

  let { params } = $props();

  const budget = $derived(await getBudget(params.uuid));
  const categories = $derived(await getCategories(params.uuid));

  const categoryOptions = $derived(
    categories.map((c) => ({
      value: c.uuid,
      name: c.name,
    })),
  );

  async function handleSuccess() {
    // Refresh the budget data
    await getBudget(params.uuid).refresh();
    // Navigate back to the budget page
    goto(Route.budget(params.uuid));
  }

  function handleCancel() {
    goto(Route.budget(params.uuid));
  }
</script>

<div class="bg-neutral-50 pb-6 dark:bg-neutral-900">
  <header
    class="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95"
  >
    <div class="flex items-center gap-3 px-4 py-4">
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
        <P size="2xl" class="text-primary-900 dark:text-primary-200 truncate font-bold">
          Record Purchase
        </P>
      </div>
    </div>
  </header>

  <main class="px-4 py-4">
    <div class="mx-auto max-w-md">
      {#if budget}
        <AddItem
          {categoryOptions}
          selectedBudgetId={params.uuid}
          hideBudgetSelect={true}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      {/if}
    </div>
  </main>
</div>
