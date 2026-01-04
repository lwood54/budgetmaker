<script lang="ts">
  import { P, Drawer, Button, Label } from 'flowbite-svelte';
  import { createPaydownDebt, updatePaydownDebt, getDebts } from '$lib/api/paydown.remote';
  import Input from '$lib/components/Input.svelte';
  import type { PaydownDebt } from '../helpers';

  type Props = {
    open?: boolean;
    onSuccess?: () => void;
    editingDebt?: PaydownDebt | null;
    activeScenarioId?: string | null;
  };

  let {
    open = $bindable(false),
    onSuccess = () => {},
    editingDebt = $bindable<PaydownDebt | null>(null),
    activeScenarioId = null,
  }: Props = $props();

  const isEditMode = $derived(editingDebt !== null);
  const initialName = $derived(editingDebt?.name ?? '');
  const initialType = $derived(editingDebt?.type ?? 'credit-card');
  const initialAmount = $derived(editingDebt?.amount.toString() ?? '');
  const initialInterestRate = $derived(editingDebt?.interestRate.toString() ?? '');
  const initialMonthlyPayment = $derived(editingDebt?.monthlyPayment.toString() ?? '');
  const initialPriority = $derived(editingDebt?.priority?.toString() ?? '1');

  // For select element, we need a reactive value
  let debtType = $state('credit-card');

  // Update debtType when drawer opens or editingDebt changes
  $effect(() => {
    if (open) {
      debtType = initialType;
    }
  });
  let isSubmitting = $state(false);
  let formRef = $state<HTMLFormElement | null>(null);
  let dirtyFields = $state({
    name: false,
    type: false,
    amount: false,
    interestRate: false,
    monthlyPayment: false,
    priority: false,
  });

  const remoteForm = $derived(isEditMode ? updatePaydownDebt : createPaydownDebt);

  $effect(() => {
    if (!open) {
      formRef?.reset();
      debtType = initialType;
      dirtyFields = {
        name: false,
        type: false,
        amount: false,
        interestRate: false,
        monthlyPayment: false,
        priority: false,
      };
    }
  });

  function handleCancel() {
    open = false;
    editingDebt = null;
  }
</script>

<Drawer bind:open placement="right" class="z-50">
  <div class="flex max-h-[100vh] w-full max-w-md flex-col bg-white dark:bg-neutral-800">
    <div
      class="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-700"
    >
      <P size="xl" class="text-primary-900 dark:text-primary-200 font-semibold">
        {isEditMode ? 'Edit Debt' : 'Add Debt'}
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
                await getDebts(activeScenarioId).refresh();
              }
              open = false;
              editingDebt = null;
              dirtyFields = {
                name: false,
                type: false,
                amount: false,
                interestRate: false,
                monthlyPayment: false,
                priority: false,
              };
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
          <input type="hidden" name="debtId" value={editingDebt?.id} />
        {:else}
          <input type="hidden" name="scenarioId" value={activeScenarioId ?? ''} />
        {/if}
        <div>
          <Label for="debt-name" class="mb-2 block">Debt Name</Label>
          <Input
            field={remoteForm.fields.name}
            isDirty={dirtyFields.name}
            id="debt-name"
            name="name"
            initialValue={initialName}
            placeholder="Enter debt name"
            disabled={isSubmitting}
            class="w-full"
            oninput={() => {
              dirtyFields.name = true;
              remoteForm.validate({ includeUntouched: false });
            }}
          />
        </div>
        <div>
          <Label for="debt-type" class="mb-2 block">Debt Type</Label>
          <select
            id="debt-type"
            name="type"
            bind:value={debtType}
            disabled={isSubmitting}
            class="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
            onchange={() => {
              dirtyFields.type = true;
              remoteForm.validate({ includeUntouched: false });
            }}
          >
            <option value="credit-card">Credit Card</option>
            <option value="car">Car Loan</option>
            <option value="mortgage">Mortgage</option>
            <option value="student-loan">Student Loan</option>
            <option value="personal-loan">Personal Loan</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <Label for="debt-amount" class="mb-2 block">Debt Amount</Label>
          <Input
            field={remoteForm.fields.amount}
            isDirty={dirtyFields.amount}
            id="debt-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            initialValue={initialAmount}
            placeholder="Enter debt amount"
            disabled={isSubmitting}
            class="w-full"
            oninput={() => {
              dirtyFields.amount = true;
              remoteForm.validate({ includeUntouched: false });
            }}
          />
        </div>
        <div>
          <Label for="debt-interest-rate" class="mb-2 block">Interest Rate (%)</Label>
          <Input
            field={remoteForm.fields.interestRate}
            isDirty={dirtyFields.interestRate}
            id="debt-interest-rate"
            name="interestRate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            initialValue={initialInterestRate}
            placeholder="Enter interest rate"
            disabled={isSubmitting}
            class="w-full"
            oninput={() => {
              dirtyFields.interestRate = true;
              remoteForm.validate({ includeUntouched: false });
            }}
          />
        </div>
        <div>
          <Label for="debt-monthly-payment" class="mb-2 block">Monthly Payment</Label>
          <Input
            field={remoteForm.fields.monthlyPayment}
            isDirty={dirtyFields.monthlyPayment}
            id="debt-monthly-payment"
            name="monthlyPayment"
            type="number"
            step="0.01"
            min="0"
            initialValue={initialMonthlyPayment}
            placeholder="Enter monthly payment"
            disabled={isSubmitting}
            class="w-full"
            oninput={() => {
              dirtyFields.monthlyPayment = true;
              remoteForm.validate({ includeUntouched: false });
            }}
          />
        </div>
        <div>
          <Label for="debt-priority" class="mb-2 block"
            >Priority (1 = highest, 0 = skip snowball)</Label
          >
          <Input
            field={remoteForm.fields.priority}
            isDirty={dirtyFields.priority}
            id="debt-priority"
            name="priority"
            type="number"
            step="1"
            min="0"
            initialValue={initialPriority}
            placeholder="1"
            disabled={isSubmitting}
            class="w-full"
            oninput={() => {
              dirtyFields.priority = true;
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
              dirtyFields = {
                name: true,
                type: true,
                amount: true,
                interestRate: true,
                monthlyPayment: true,
                priority: true,
              };
            }}
            color="primary"
            disabled={isSubmitting}
            class="flex-1"
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save' : 'Add Debt'}
          </Button>
        </div>
      </form>
    </div>
  </div>
</Drawer>
