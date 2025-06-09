<script lang="ts">
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import { Input, P, Spinner } from 'flowbite-svelte';
  import EditBudgetButton from './EditBudgetButton.svelte';
  import DeleteBudgetButton from './DeleteBudgetButton.svelte';
  import { enhance } from '$app/forms';

  let {
    budget,
    isDelete,
    isEdit,
    onClose,
    onEdit,
    onDelete,
  }: {
    budget?: BudgetWithRelations;
    isDelete?: boolean;
    isEdit?: boolean;
    onClose: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
  } = $props();
  let editBudgetName = $state('');
  let isSubmitting = $state(false);
  const isAddBudget = $derived(budget === undefined);

  const formAction = $derived(() => {
    if (!budget) {
      return `/budgets?/addBudget`;
    }
    if (isEdit) {
      return `/budgets?/editBudget&budgetUUID=${budget.uuid}`;
    }
    if (isDelete) {
      return `/budgets?/deleteBudget&budgetUUID=${budget.uuid}`;
    }
  });

  $effect(() => {
    if (isEdit && budget) {
      editBudgetName = budget.name;
    }
  });
</script>

<form
  action={formAction()}
  class="w-full"
  use:enhance={async () => {
    isSubmitting = true;
    return async ({ update }) => {
      await update();
      isSubmitting = false;
      onClose();
    };
  }}
  method="post"
>
  <div class="flex w-full items-center justify-between gap-2">
    {#if isEdit || isAddBudget}
      <Input
        onclick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        name="name"
        placeholder="groceries"
        class="text-lg"
        bind:value={editBudgetName}
      />
    {:else}
      <P
        class="text-primary-900 dark:text-primary-200 overflow-hidden text-ellipsis whitespace-nowrap"
        >{budget?.name}</P
      >
    {/if}
    <div class="flex w-24 flex-shrink-0 justify-center gap-2">
      {#if isSubmitting}
        <Spinner />
      {:else}
        <EditBudgetButton isEdit={isEdit || isAddBudget} {budget} {onEdit} />
        <DeleteBudgetButton isEdit={isEdit || isAddBudget} {budget} onCancel={onClose} {onDelete} />
      {/if}
    </div>
  </div>
</form>
