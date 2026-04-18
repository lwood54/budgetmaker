<script lang="ts">
  import { Button, P, Modal } from 'flowbite-svelte';
  import SelectWithSearch from '$lib/components/SelectWithSearch.svelte';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';

  import { type PaydownDebt, type MonthlyIncome, type RecurringExpense } from '../helpers';
  import { getScenarios, deletePaydownScenario } from '$lib/api/paydown.remote';
  import AddDebtDrawer from './AddDebtDrawer.svelte';
  import AddIncomeDrawer from './AddIncomeDrawer.svelte';
  import AddRecurringExpenseDrawer from './AddRecurringExpenseDrawer.svelte';
  import IncomesColumn from './IncomesColumn.svelte';
  import DebtsColumn from './DebtsColumn.svelte';
  import RecurringExpensesColumn from './RecurringExpensesColumn.svelte';
  import AddScenarioDrawer from './AddScenarioDrawer.svelte';
  import type { PaydownScenario } from '$lib/server/db/schema';

  let selectedScenarioId = $state<string>('');

  let showNewScenarioModal = $state(false);
  let scenarios = $derived(await getScenarios());
  let activeScenario = $state<PaydownScenario | null>(null);
  let showDeleteScenarioModal = $state(false);

  // Income drawer state
  let incomeDrawerOpen = $state(false);
  let editingIncome = $state<MonthlyIncome | null>(null);

  // Debt drawer state
  let debtDrawerOpen = $state(false);
  let editingDebt = $state<PaydownDebt | null>(null);

  // Recurring expense drawer state
  let expenseDrawerOpen = $state(false);
  let editingExpense = $state<RecurringExpense | null>(null);

  function handleDeleteScenarioClick() {
    showDeleteScenarioModal = true;
  }

  // Sync activeScenario with selectedScenarioId
  $effect(() => {
    if (selectedScenarioId) {
      const matchingScenario = scenarios.find((s) => s.uuid === selectedScenarioId);
      activeScenario = matchingScenario ?? null;
    } else {
      activeScenario = null;
    }
  });
</script>

<div class="mb-6 flex items-center gap-3">
  <SelectWithSearch
    bind:value={selectedScenarioId}
    class="w-80"
    items={scenarios.map((s) => ({ value: s.uuid, name: s.name }))}
    placeholder="Select a scenario"
    searchPlaceholder="Search scenarios..."
  />
  <Button
    color="primary"
    onclick={() => {
      showNewScenarioModal = true;
    }}
    aria-label="Add new scenario"
  >
    + Scenario
  </Button>
</div>
<div
  class="rounded-lg border-2 border-neutral-300 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50"
>
  {#if activeScenario}
    <div class="mb-4 flex items-center justify-between">
      <P size="xl" class="font-semibold">{activeScenario.name}</P>
      <DeleteIcon
        onclick={() => {
          handleDeleteScenarioClick();
        }}
        ariaLabel="Delete scenario"
      />
    </div>
    <div class="flex w-full flex-col gap-8 lg:flex-row lg:items-start">
      <IncomesColumn
        activeScenarioId={activeScenario.uuid}
        onAddClick={() => {
          editingIncome = null;
          incomeDrawerOpen = true;
        }}
        onDelete={() => {}}
        onEdit={(income: MonthlyIncome) => {
          editingIncome = income;
          incomeDrawerOpen = true;
        }}
      />
      <DebtsColumn
        activeScenarioId={activeScenario.uuid}
        onAddClick={() => {
          editingDebt = null;
          debtDrawerOpen = true;
        }}
        onDelete={() => {}}
        onEdit={(debt: PaydownDebt) => {
          editingDebt = debt;
          debtDrawerOpen = true;
        }}
      />
      <RecurringExpensesColumn
        activeScenarioId={activeScenario.uuid}
        onAddClick={() => {
          editingExpense = null;
          expenseDrawerOpen = true;
        }}
        onDelete={() => {}}
        onEdit={(expense: RecurringExpense) => {
          editingExpense = expense;
          expenseDrawerOpen = true;
        }}
      />
    </div>
  {:else}
    <P class="text-neutral-600 dark:text-neutral-400">
      Please select or create a scenario to get started.
    </P>
  {/if}
</div>
<AddScenarioDrawer
  bind:open={showNewScenarioModal}
  onSuccess={(id) => {
    selectedScenarioId = id;
    activeScenario = scenarios.find((s) => s.uuid === id) ?? null;
  }}
/>
<AddIncomeDrawer
  bind:open={incomeDrawerOpen}
  bind:editingIncome
  activeScenarioId={activeScenario?.uuid ?? null}
  onSuccess={() => {
    editingIncome = null;
  }}
/>
<AddDebtDrawer
  bind:open={debtDrawerOpen}
  bind:editingDebt
  activeScenarioId={activeScenario?.uuid ?? null}
  onSuccess={() => {
    editingDebt = null;
  }}
/>
<AddRecurringExpenseDrawer
  bind:open={expenseDrawerOpen}
  bind:editingExpense
  activeScenarioId={activeScenario?.uuid ?? null}
  onSuccess={() => {
    editingExpense = null;
  }}
/>
<Modal bind:open={showDeleteScenarioModal} title="Delete Scenario">
  {#if activeScenario}
    <form
      {...deletePaydownScenario.enhance(async ({ submit }) => {
        await submit();
        showDeleteScenarioModal = false;
        // Clear selection - the effect will sync activeScenario
        selectedScenarioId = '';
        await getScenarios().refresh();
        // Ensure selection stays cleared after scenarios update
        selectedScenarioId = '';
      })}
      class="flex flex-col gap-4"
    >
      <input type="hidden" name="scenarioId" value={activeScenario.uuid} />
      <P size="base">
        Are you sure you want to delete "{activeScenario.name}"? All debts, incomes, and expenses in
        this scenario will be permanently deleted.
      </P>
      <div class="flex justify-end gap-2">
        <Button type="button" color="gray" onclick={() => (showDeleteScenarioModal = false)}
          >Cancel</Button
        >
        <Button type="submit" color="red">Delete</Button>
      </div>
    </form>
  {/if}
</Modal>
