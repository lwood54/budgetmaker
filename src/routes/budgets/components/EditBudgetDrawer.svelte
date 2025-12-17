<script lang="ts">
  import { Drawer, Button, P, Input } from 'flowbite-svelte';
  import { updateBudget } from '$lib/api/budgets.remote';

  interface Props {
    open?: boolean;
    budgetId: string;
    initialName: string;
    onSuccess?: () => void;
    onCancel?: () => void;
  }

  let { open = $bindable(false), budgetId, initialName, onSuccess, onCancel }: Props = $props();

  let budgetName = $state(initialName);
  let isUpdatingBudget = $state(false);

  // Update budgetName when initialName changes
  $effect(() => {
    budgetName = initialName;
  });

  function handleCancel() {
    budgetName = initialName;
    open = false;
    onCancel?.();
  }

  function handleSuccess() {
    budgetName = initialName;
    open = false;
    onSuccess?.();
  }
</script>

<Drawer bind:open placement="bottom" class="z-50">
  <div class="flex max-h-[90vh] w-full flex-col bg-white dark:bg-neutral-800">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
    >
      <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">Edit Budget</P>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <form
        {...updateBudget.enhance(async ({ form, submit }) => {
          isUpdatingBudget = true;
          try {
            await submit();

            if (updateBudget.result?.success === true) {
              form.reset();
              await handleSuccess();
            }
          } catch (error) {
            console.error('Error updating budget:', error);
          } finally {
            isUpdatingBudget = false;
          }
        })}
        class="space-y-4"
      >
        <input type="hidden" name="budgetId" value={budgetId} />
        <div>
          <label
            for="budget-name"
            class="mb-2 block text-base font-medium text-neutral-900 dark:text-neutral-300"
          >
            Budget Name
          </label>
          <Input
            id="budget-name"
            name="name"
            bind:value={budgetName}
            placeholder="Enter budget name"
            required
            disabled={isUpdatingBudget}
            class="w-full"
          />
        </div>

        <div class="flex w-full justify-between gap-4 pt-4">
          <Button
            onclick={handleCancel}
            color="alternative"
            disabled={isUpdatingBudget}
            class="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            disabled={isUpdatingBudget || !budgetName.trim()}
            class="flex-1"
          >
            {isUpdatingBudget ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  </div>
</Drawer>
