<script lang="ts">
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import { Button, Modal, P } from 'flowbite-svelte';
  import { CloseOutline, TrashBinOutline } from 'flowbite-svelte-icons';

  let {
    budget,
    isEdit,
    onCancel,
    onDelete,
  }: {
    budget?: BudgetWithRelations;
    isEdit: boolean;
    onCancel: () => void;
    onDelete?: () => void;
  } = $props();
  let isSubmitting = $state(false);
  let isDelete = $state(false);
  const isAddBudget = $derived(budget === undefined);
</script>

<Modal title="Remove Purchase" bind:open={isDelete} autoclose>
  <P size="lg">Are you sure you want to delete this budget?</P>
  <P class="text-primary-900 dark:text-primary-200 font-semibold">{budget?.name}</P>

  {#snippet footer()}
    <div class="flex w-full justify-end gap-4">
      <Button
        onclick={() => {
          isDelete = false;
        }}
        color="alternative">Cancel</Button
      >
      <Button color="red" type="submit" disabled={isSubmitting}>Remove</Button>
    </div>
  {/snippet}
</Modal>
{#if isEdit || isAddBudget}
  <Button
    color="red"
    size="xs"
    outline
    class="h-4 w-4 rounded-full border-red-900 p-4 hover:border-2 hover:bg-transparent dark:hover:border-red-200 hover:dark:bg-transparent"
    onclick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    }}
  >
    <CloseOutline size="sm" class="text-red-600 dark:text-red-300" />
  </Button>
{:else}
  <Button
    color="red"
    size="xs"
    outline
    class="h-4 w-4 rounded-full border-red-900 p-4 hover:border-2 hover:bg-transparent dark:hover:border-red-200 hover:dark:bg-transparent"
    onclick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      isDelete = true;
      onDelete?.();
    }}
    disabled={isSubmitting}
  >
    <TrashBinOutline size="sm" class="text-red-600 dark:text-red-300" />
  </Button>
{/if}
