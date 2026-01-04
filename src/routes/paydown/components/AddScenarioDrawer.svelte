<script lang="ts">
  import { P, Drawer, Button, Label } from 'flowbite-svelte';
  import {
    createPaydownScenario,
    updatePaydownScenario,
    getScenarios,
  } from '$lib/api/paydown.remote';
  import Input from '$lib/components/Input.svelte';
  import type { PaydownScenario } from '$lib/server/db/schema/paydown';

  type Props = {
    open?: boolean;
    onSuccess?: (id: string) => void;
    editingScenario?: PaydownScenario | null;
  };

  let {
    open = $bindable(false),
    onSuccess = (_id: string) => {},
    editingScenario = $bindable<PaydownScenario | null>(null),
  }: Props = $props();

  const isEditMode = $derived(editingScenario !== null);
  const initialName = $derived(editingScenario?.name ?? '');
  let isSubmitting = $state(false);
  let formRef = $state<HTMLFormElement | null>(null);
  let isFormDirty = $state(false);

  const remoteForm = $derived(isEditMode ? updatePaydownScenario : createPaydownScenario);

  function handleCancel() {
    open = false;
    formRef?.reset();
    isFormDirty = false;
  }
</script>

<Drawer bind:open placement="right" class="z-50">
  <div class="flex max-h-[100vh] w-full max-w-md flex-col bg-white dark:bg-neutral-800">
    <div
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
    >
      <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">
        {isEditMode ? 'Edit Scenario' : 'Add Scenario'}
      </P>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-4">
      <form
        bind:this={formRef}
        oninput={() => {
          remoteForm.validate({ includeUntouched: false });
          isFormDirty = true;
        }}
        {...remoteForm.enhance(async ({ form: formElement, submit }) => {
          isSubmitting = true;
          try {
            await submit();

            if (remoteForm.result?.success === true) {
              formElement.reset();
              await getScenarios().refresh();
              open = false;
              if (isEditMode && editingScenario) {
                onSuccess(editingScenario.uuid);
              } else if (!isEditMode && 'id' in remoteForm.result) {
                onSuccess(remoteForm.result.id);
              }
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
          <input type="hidden" name="scenarioId" value={editingScenario?.uuid} />
        {/if}
        <div>
          <Label for="scenario-name" class="mb-2 block">Scenario Name</Label>
          <Input
            field={remoteForm.fields.name}
            isDirty={isFormDirty}
            id="scenario-name"
            name="name"
            initialValue={initialName}
            placeholder="Enter scenario name"
            disabled={isSubmitting}
            class="w-full"
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
              isFormDirty = true;
            }}
            color="primary"
            disabled={isSubmitting}
            class="flex-1"
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  </div>
</Drawer>
