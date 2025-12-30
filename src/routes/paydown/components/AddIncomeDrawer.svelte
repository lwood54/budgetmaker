<script lang="ts">
  import { Button, P, Drawer } from 'flowbite-svelte';
  import { addIncome } from '../helpers';

  let { open = $bindable(false), onSuccess = () => {} } = $props();

  // Income form fields
  let incomeTitle = $state('');
  let incomeAmount = $state('');

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    if (!incomeTitle.trim()) return;

    addIncome({
      title: incomeTitle.trim(),
      amount: parseFloat(incomeAmount) || 0,
    });

    // Reset form
    incomeTitle = '';
    incomeAmount = '';

    // Close drawer
    open = false;

    // Notify parent to reload
    onSuccess();
  }

  function handleCancel() {
    open = false;
  }
</script>

<Drawer bind:open placement="right" class="z-50">
  <div class="flex max-h-[100vh] w-full max-w-md flex-col bg-white dark:bg-neutral-800">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
    >
      <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">Add Income</P>
    </div>

    <!-- Form Content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <form onsubmit={handleSubmit} class="flex flex-col gap-4">
        <div>
          <P size="sm" class="mb-2">Title</P>
          <input
            type="text"
            bind:value={incomeTitle}
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div>
          <P size="sm" class="mb-2">Monthly Amount</P>
          <input
            type="number"
            bind:value={incomeAmount}
            step="0.01"
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div class="flex gap-4 pt-4">
          <Button type="button" color="alternative" class="flex-1" onclick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" class="flex-1">Add Income</Button>
        </div>
      </form>
    </div>
  </div>
</Drawer>
