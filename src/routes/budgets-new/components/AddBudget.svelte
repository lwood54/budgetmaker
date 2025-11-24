<script lang="ts">
  import { Button, Label } from 'flowbite-svelte';
  import Input from '$lib/components/Input.svelte';
  import { addBudget } from '$lib/api/budgets.remote';

  type Props = {
    onSuccess: () => void;
  };

  let { onSuccess }: Props = $props();
  let isSubmitting = $state(false);
</script>

<form
  {...addBudget.enhance(async ({ form, submit }) => {
    isSubmitting = true;
    try {
      await submit();

      if (addBudget.result?.success === true) {
        form.reset();
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
      class="text-lg"
    />
  </div>
  <Button type="submit" color="primary" class="w-full" disabled={isSubmitting}>
    Create Budget
  </Button>
</form>
