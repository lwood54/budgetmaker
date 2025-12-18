<script lang="ts">
  import { Button, Label } from 'flowbite-svelte';
  import Input from '$lib/components/Input.svelte';
  import { addBudget, getBudgets } from '$lib/api/budgets.remote';

  type Props = {
    onSuccess: () => void;
    onCancel?: () => void;
  };

  let { onSuccess, onCancel }: Props = $props();
  let isSubmitting = $state(false);
</script>

<form
  {...addBudget.enhance(async ({ form, submit }) => {
    isSubmitting = true;
    try {
      await submit();

      if (addBudget.result?.success === true) {
        form.reset();
        // Refresh budgets list
        await getBudgets().refresh();
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      isSubmitting = false;
    }
  })}
  class="space-y-4"
>
  <div>
    <Label for="budget-name" class="mb-2 block">Budget Name</Label>
    <Input
      field={addBudget.fields.name}
      placeholder="e.g., Groceries"
      disabled={isSubmitting}
      class="text-xl"
    />
  </div>
  <div class="flex w-full gap-4 pt-4">
    {#if onCancel}
      <Button
        type="button"
        onclick={onCancel}
        color="alternative"
        disabled={isSubmitting}
        class="flex-1"
      >
        Cancel
      </Button>
    {/if}
    <Button
      type="submit"
      color="primary"
      class={onCancel ? 'flex-1' : 'w-full'}
      disabled={isSubmitting}
    >
      Create Budget
    </Button>
  </div>
</form>
