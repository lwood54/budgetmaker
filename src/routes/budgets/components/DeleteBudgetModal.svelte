<script lang="ts">
  import { Modal, Button, P } from 'flowbite-svelte';
  import { deleteBudget } from '$lib/api/budgets.remote';

  interface Props {
    open?: boolean;
    budgetId: string;
    budgetName: string;
    onSuccess?: () => void;
    onCancel?: () => void;
  }

  let { open = $bindable(false), budgetId, budgetName, onSuccess, onCancel }: Props = $props();

  let isDeleting = $state(false);

  function handleCancel() {
    open = false;
    onCancel?.();
  }

  async function handleSuccess() {
    open = false;
    onSuccess?.();
  }
</script>

<Modal title="Delete Budget" bind:open autoclose>
  <P size="xl">Are you sure you want to delete this budget?</P>
  <P class="text-primary-900 dark:text-primary-200 font-semibold">{budgetName}</P>
  <P size="base" class="mt-2 text-neutral-600 dark:text-neutral-400">
    This action cannot be undone. All categories and purchases in this budget will be deleted.
  </P>

  {#snippet footer()}
    <div class="flex w-full justify-between gap-4">
      <Button onclick={handleCancel} color="alternative" disabled={isDeleting}>Cancel</Button>
      <form
        {...deleteBudget.enhance(async ({ form, submit }) => {
          isDeleting = true;
          try {
            await submit();

            if (deleteBudget.result?.success === true) {
              form.reset();
              await handleSuccess();
            }
          } catch (error) {
            console.error('Error deleting budget:', error);
          } finally {
            isDeleting = false;
          }
        })}
      >
        <input type="hidden" name="budgetId" value={budgetId} />
        <Button color="red" type="submit" disabled={isDeleting}>Delete</Button>
      </form>
    </div>
  {/snippet}
</Modal>
