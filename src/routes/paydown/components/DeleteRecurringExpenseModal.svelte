<script lang="ts">
  import { Modal, Button, P } from 'flowbite-svelte';
  import { deletePaydownRecurringExpense } from '$lib/api/paydown.remote';

  interface Props {
    open?: boolean;
    expenseId: string;
    expenseTitle: string;
    onSuccess?: () => void;
    onCancel?: () => void;
  }

  let { open = $bindable(false), expenseId, expenseTitle, onSuccess, onCancel }: Props = $props();

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

<Modal title="Delete Recurring Expense" bind:open autoclose>
  <P size="xl">Are you sure you want to delete this recurring expense?</P>
  <P class="text-primary-900 dark:text-primary-200 font-semibold">{expenseTitle}</P>
  <P size="base" class="mt-2 text-neutral-600 dark:text-neutral-400">
    This action cannot be undone.
  </P>

  {#snippet footer()}
    <div class="flex w-full justify-between gap-4">
      <Button onclick={handleCancel} color="alternative" disabled={isDeleting}>Cancel</Button>
      <form
        {...deletePaydownRecurringExpense.enhance(async ({ form, submit }) => {
          isDeleting = true;
          try {
            await submit();

            if (deletePaydownRecurringExpense.result?.success === true) {
              form.reset();
              await handleSuccess();
            }
          } catch (error) {
            console.error('Error deleting recurring expense:', error);
          } finally {
            isDeleting = false;
          }
        })}
      >
        <input type="hidden" name="expenseId" value={expenseId} />
        <Button color="red" type="submit" disabled={isDeleting}>Delete</Button>
      </form>
    </div>
  {/snippet}
</Modal>
