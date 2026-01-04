<script lang="ts">
  import { P, Drawer, Button, Label } from 'flowbite-svelte';
  import { createPaydownIncome, updatePaydownIncome, getIncomes } from '$lib/api/paydown.remote';
  import Input from '$lib/components/Input.svelte';
  import type { MonthlyIncome } from '../helpers';

  type Props = {
    open?: boolean;
    onSuccess?: () => void;
    editingIncome?: MonthlyIncome | null;
    activeScenarioId?: string | null;
  };

  let {
    open = $bindable(false),
    onSuccess = () => {},
    editingIncome = $bindable<MonthlyIncome | null>(null),
    activeScenarioId = null,
  }: Props = $props();

  const isEditMode = $derived(editingIncome !== null);
  const initialTitle = $derived(editingIncome?.title ?? '');
  const initialAmount = $derived(editingIncome?.amount.toString() ?? '');
  let isSubmitting = $state(false);
  let formRef = $state<HTMLFormElement | null>(null);
  let dirtyFields = $state({ title: false, amount: false });

  const remoteForm = $derived(isEditMode ? updatePaydownIncome : createPaydownIncome);

  $effect(() => {
    if (!open) {
      formRef?.reset();
      dirtyFields = { title: false, amount: false };
    }
  });

  function handleCancel() {
    open = false;
    editingIncome = null;
  }
</script>

<Drawer bind:open placement="right" class="z-50">
  <div class="flex max-h-[100vh] w-full max-w-md flex-col bg-white dark:bg-neutral-800">
    <div
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
    >
      <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">
        {isEditMode ? 'Edit Income' : 'Add Income'}
      </P>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-4">
      <form
        bind:this={formRef}
        {...remoteForm.enhance(async ({ form: formElement, submit }) => {
          isSubmitting = true;
          try {
            await submit();

            if (remoteForm.result?.success === true) {
              formElement.reset();
              if (activeScenarioId) {
                await getIncomes(activeScenarioId).refresh();
              }
              open = false;
              editingIncome = null;
              dirtyFields = { title: false, amount: false };
              onSuccess();
            }
          } catch (error) {
            console.error('Error submitting form:', error);
            formElement.reset();
          } finally {
            isSubmitting = false;
          }
        })}
        class="flex flex-col gap-4"
      >
        {#if isEditMode}
          <input type="hidden" name="incomeId" value={editingIncome?.id} />
        {:else}
          <input type="hidden" name="scenarioId" value={activeScenarioId ?? ''} />
        {/if}
        <div>
          <Label for="income-title" class="mb-2 block">Title</Label>
          <Input
            field={remoteForm.fields.title}
            isDirty={dirtyFields.title}
            id="income-title"
            name="title"
            initialValue={initialTitle}
            placeholder="Enter income title"
            disabled={isSubmitting}
            class="w-full"
            oninput={() => {
              dirtyFields.title = true;
              remoteForm.validate({ includeUntouched: false });
            }}
          />
        </div>
        <div>
          <Label for="income-amount" class="mb-2 block">Monthly Amount</Label>
          <Input
            field={remoteForm.fields.amount}
            isDirty={dirtyFields.amount}
            id="income-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            initialValue={initialAmount}
            placeholder="Enter monthly amount"
            disabled={isSubmitting}
            class="w-full"
            oninput={() => {
              dirtyFields.amount = true;
              remoteForm.validate({ includeUntouched: false });
            }}
          />
        </div>
        <div class="flex gap-3 pt-4">
          <Button
            type="button"
            color="alternative"
            onclick={handleCancel}
            disabled={isSubmitting}
            class="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onclick={() => {
              dirtyFields = { title: true, amount: true };
            }}
            color="primary"
            disabled={isSubmitting}
            class="flex-1"
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save' : 'Add Income'}
          </Button>
        </div>
      </form>
    </div>
  </div>
</Drawer>
