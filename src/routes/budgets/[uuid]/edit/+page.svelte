<script lang="ts">
  import { Button, P, Label } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import Input from '$lib/components/Input.svelte';
  import { updateBudget, getBudget, getBudgets } from '$lib/api/budgets.remote';
  import { goto } from '$app/navigation';
  import { Route } from '$lib/constants/routes';
  import { page } from '$app/state';

  let { params } = $props();

  // Get the "from" query parameter to know where to navigate back to
  const fromUrl = $derived(page.url.searchParams.get('from') || Route.budget(params.uuid));

  const budgetData = $derived(await getBudget(params.uuid));

  // Compute initial values reactively from budgetData
  const initialName = $derived(budgetData?.name ?? '');

  let isSubmitting = $state(false);

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
        aria-label="Back to budget"
      >
        <ArrowLeftOutline class="text-primary-900 dark:text-primary-200 h-5 w-5" />
      </Button>
      <div class="min-w-0 flex-1">
        <P size="2xl" class="text-primary-900 dark:text-primary-200 truncate font-bold">
          Edit Budget
        </P>
      </div>
    </div>
  </header>

  <!-- Content -->
  <div class="mx-auto max-w-[1244px] px-4 py-6">
    {#if budgetData}
      <form
        {...updateBudget.enhance(async ({ form, submit }) => {
          isSubmitting = true;
          try {
            await submit();

            if (updateBudget.result?.success === true) {
              form.reset();
              // Refresh the budget data and budgets list
              await Promise.all([getBudget(params.uuid).refresh(), getBudgets().refresh()]);
              // Navigate back to where we came from
              goto(fromUrl);
            }
          } catch (error) {
            console.error('Error updating budget:', error);
          } finally {
            isSubmitting = false;
          }
        })}
        class="space-y-4"
      >
        <input type="hidden" name="budgetId" value={params.uuid} />
        <div>
          <Label
            for="budget-name"
            class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
          >
            Budget Name
          </Label>
          <Input
            field={updateBudget.fields.name}
            id="budget-name"
            name="name"
            initialValue={initialName}
            placeholder="e.g., Groceries"
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
            disabled={isSubmitting || !initialName.trim()}
            class="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    {:else}
      <P class="text-neutral-600 dark:text-neutral-400">Loading budget...</P>
    {/if}
  </div>
</div>
