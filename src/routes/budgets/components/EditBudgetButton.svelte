<script lang="ts">
  import type { BudgetWithRelations } from '$lib/server/db/schema';
  import { Button } from 'flowbite-svelte';
  import { FloppyDiskOutline, PenOutline } from 'flowbite-svelte-icons';

  let { isEdit, onEdit }: { budget?: BudgetWithRelations; isEdit: boolean; onEdit?: () => void } =
    $props();
  let isSubmitting = $state(false);
</script>

{#if isEdit}
  <Button
    size="xs"
    class="border-primary-900 dark:hover:border-primary-200 h-4 w-4 rounded-full p-4 hover:border-2 hover:bg-transparent hover:dark:bg-transparent"
    outline
    type="submit"
    disabled={isSubmitting}
  >
    <FloppyDiskOutline size="sm" class="text-primary-900 dark:text-primary-200" />
  </Button>
{:else}
  <Button
    size="xs"
    class="border-primary-900 dark:hover:border-primary-200 h-4 w-4 rounded-full p-4 hover:border-2 hover:bg-transparent hover:dark:bg-transparent"
    outline
    onclick={(e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onEdit?.();
    }}
  >
    <PenOutline size="sm" class="text-primary-900 dark:text-primary-200" />
  </Button>
{/if}
