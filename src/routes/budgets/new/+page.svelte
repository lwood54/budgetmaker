<script lang="ts">
  import { Button, P } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import AddBudget from '../components/AddBudget.svelte';
  import { goto } from '$app/navigation';
  import { Route } from '$lib/constants/routes';

  function handleSuccess() {
    goto(Route.budgets);
  }

  function handleCancel() {
    goto(Route.budgets);
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
        onclick={() => goto(Route.budgets)}
        aria-label="Back to budgets"
      >
        <ArrowLeftOutline class="text-primary-900 dark:text-primary-200 h-5 w-5" />
      </Button>
      <div class="min-w-0 flex-1">
        <P size="2xl" class="text-primary-900 dark:text-primary-200 truncate font-bold">
          Create Budget
        </P>
      </div>
    </div>
  </header>

  <main class="px-4 py-4">
    <div class="mx-auto max-w-md">
      <AddBudget onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  </main>
</div>
