<script lang="ts">
  import { Button, P, Input, Modal, Label } from 'flowbite-svelte';
  import SelectWithSearch from '$lib/components/SelectWithSearch.svelte';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';

  import { type PaydownDebt, type MonthlyIncome, type RecurringExpense } from '../helpers';
  import {
    getScenarios,
    getActiveScenario,
    createPaydownScenario,
    deletePaydownScenario,
    setActivePaydownScenario,
  } from '$lib/api/paydown.remote';
  import AddDebtDrawer from './AddDebtDrawer.svelte';
  import AddIncomeDrawer from './AddIncomeDrawer.svelte';
  import AddRecurringExpenseDrawer from './AddRecurringExpenseDrawer.svelte';
  import IncomesColumn from './IncomesColumn.svelte';
  import DebtsColumn from './DebtsColumn.svelte';
  import RecurringExpensesColumn from './RecurringExpensesColumn.svelte';

  let debtDrawerOpen = $state(false);
  let incomeDrawerOpen = $state(false);
  let recurringExpensesDrawerOpen = $state(false);

  // Scenario management with remote queries
  // Use async derived values directly - they will be accessed immediately via derived values below
  const scenarios = $derived((await getScenarios()) ?? []);
  const activeScenarioResult = $derived(await getActiveScenario());
  const activeScenario = $derived(activeScenarioResult ?? null);
  const activeScenarioId = $derived(activeScenario?.id ?? null);

  let newScenarioName = $state('');
  let savedScenarioName = $state('');
  let showNewScenarioModal = $state(false);
  let showDeleteScenarioModal = $state(false);
  let scenarioToDelete = $state<typeof activeScenario | null>(null);

  // Edit state
  let editingDebt = $state<PaydownDebt | null>(null);
  let editingIncome = $state<MonthlyIncome | null>(null);
  let editingExpense = $state<RecurringExpense | null>(null);

  // These derived values access scenarios immediately to avoid waterfall
  // canCreateScenario and scenariosItems both read scenarios synchronously
  const canCreateScenario = $derived(scenarios.length < 5);
  const scenariosItems = $derived(scenarios.map((s) => ({ value: s.id, name: s.name })));

  let selectedScenarioId = $state<string | null>(null);
  let previousScenarioId = $state<string | null>(null);
  let isSettingActive = $state(false); // Track when we're setting a scenario as active

  $effect(() => {
    const currentActiveId = activeScenarioId;
    const currentSelectedId = selectedScenarioId;

    if (!isSettingActive && currentActiveId) {
      const selectedScenarioExists = currentSelectedId
        ? scenarios.some((s) => s.id === currentSelectedId)
        : false;

      if (currentSelectedId === null || !selectedScenarioExists) {
        selectedScenarioId = currentActiveId;
        previousScenarioId = currentActiveId; // Update previous to match
      }
    }
  });

  $effect(() => {
    const currentSelectedId = selectedScenarioId;
    const currentPreviousId = previousScenarioId;
    if (currentSelectedId && currentSelectedId !== currentPreviousId && !isSettingActive) {
      isSettingActive = true;
      if (typeof document !== 'undefined') {
        const form = document.getElementById('set-active-scenario-form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  });

  async function handleCreateScenarioSubmit() {
    savedScenarioName = newScenarioName.trim();
    newScenarioName = '';
    showNewScenarioModal = false;
    await getScenarios().refresh();
    await getActiveScenario().refresh();

    // Use reactive values instead of awaiting again
    // The reactive values will update automatically after refresh
    if (!activeScenario && scenarios && scenarios.length > 0) {
      // Find the newly created scenario (should match the name we just saved)
      const newScenario =
        scenarios.find((s) => s.name === savedScenarioName) || scenarios[scenarios.length - 1];

      if (newScenario) {
        selectedScenarioId = newScenario.id;
        // The effect will trigger the form submission to set it as active
        // The form submission will refresh getActiveScenario() automatically
      }
    }

    savedScenarioName = '';

    // Dispatch event to refresh components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paydown-data-changed'));
    }
  }

  function handleEditDebt(debt: PaydownDebt) {
    editingDebt = debt;
    debtDrawerOpen = true;
  }

  function handleEditIncome(income: MonthlyIncome) {
    editingIncome = income;
    incomeDrawerOpen = true;
  }

  function handleEditRecurringExpense(expense: RecurringExpense) {
    editingExpense = expense;
    recurringExpensesDrawerOpen = true;
  }

  function handleDeleteScenarioClick(scenario: typeof activeScenario) {
    if (!scenario) return;
    scenarioToDelete = scenario;
    showDeleteScenarioModal = true;
  }

  function handleDeleteScenarioConfirm() {
    showDeleteScenarioModal = false;
    scenarioToDelete = null;
    getScenarios().refresh();
    getActiveScenario().refresh();
    // Dispatch event to refresh components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paydown-data-changed'));
    }
  }

  function handleDeleteScenarioCancel() {
    showDeleteScenarioModal = false;
    scenarioToDelete = null;
  }
</script>

<!-- Hidden form for setting active scenario -->
<form
  id="set-active-scenario-form"
  {...setActivePaydownScenario.enhance(async ({ submit }) => {
    try {
      await submit();
      getScenarios().refresh();
      await getActiveScenario().refresh();
      // Update previousScenarioId only after successful submission
      previousScenarioId = selectedScenarioId;
      // Dispatch event to refresh components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('paydown-data-changed'));
      }
    } catch (error) {
      // On error, reset selectedScenarioId to the previous value
      selectedScenarioId = previousScenarioId;
      throw error;
    } finally {
      // Reset the flag after form submission completes (success or failure)
      isSettingActive = false;
    }
  })}
  style="display: none;"
>
  <input type="hidden" name="scenarioId" value={selectedScenarioId || ''} />
</form>

<div class="mb-6 flex items-center gap-3">
  <SelectWithSearch
    items={scenariosItems}
    bind:value={selectedScenarioId}
    placeholder="Select a scenario"
    searchPlaceholder="Search scenarios..."
    class="w-80"
  />
  <Button
    color="primary"
    disabled={!canCreateScenario}
    onclick={() => {
      newScenarioName = '';
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
        onclick={() => handleDeleteScenarioClick(activeScenario)}
        ariaLabel="Delete scenario"
      />
    </div>
  {/if}
  {#if activeScenario}
    <div class="flex w-full flex-col gap-8 lg:flex-row lg:items-start">
      <IncomesColumn
        {activeScenarioId}
        onAddClick={() => {
          editingIncome = null;
          incomeDrawerOpen = true;
        }}
        onDelete={() => {}}
        onEdit={handleEditIncome}
      />
      <DebtsColumn
        {activeScenarioId}
        onAddClick={() => {
          editingDebt = null;
          debtDrawerOpen = true;
        }}
        onDelete={() => {}}
        onEdit={handleEditDebt}
      />
      <RecurringExpensesColumn
        {activeScenarioId}
        onAddClick={() => {
          editingExpense = null;
          recurringExpensesDrawerOpen = true;
        }}
        onDelete={() => {}}
        onEdit={handleEditRecurringExpense}
      />
    </div>
  {:else}
    <P class="text-neutral-600 dark:text-neutral-400">
      Please select or create a scenario to get started.
    </P>
  {/if}
</div>

<AddDebtDrawer
  bind:open={debtDrawerOpen}
  bind:editingDebt
  {activeScenarioId}
  onSuccess={() => {
    editingDebt = null;
    // Columns will automatically refresh via reactive queries when data changes
    // No need to dispatch events or refresh manually
  }}
/>
<AddIncomeDrawer
  bind:open={incomeDrawerOpen}
  bind:editingIncome
  {activeScenarioId}
  onSuccess={() => {
    editingIncome = null;
    // Columns will automatically refresh via reactive queries when data changes
    // No need to dispatch events or refresh manually
  }}
/>
<AddRecurringExpenseDrawer
  bind:open={recurringExpensesDrawerOpen}
  bind:editingExpense
  {activeScenarioId}
  onSuccess={() => {
    editingExpense = null;
    // Columns will automatically refresh via reactive queries when data changes
    // No need to dispatch events or refresh manually
  }}
/>

<Modal bind:open={showNewScenarioModal} title="Create New Scenario">
  <form
    {...createPaydownScenario.enhance(async ({ submit }) => {
      await submit();
      handleCreateScenarioSubmit();
    })}
    class="flex flex-col gap-4"
  >
    <P size="sm" class="text-neutral-600 dark:text-neutral-400">
      Create a new scenario to plan different financial situations.
    </P>
    <div>
      <Label for="new-scenario-name" class="mb-2 block">Scenario Name</Label>
      <Input
        id="new-scenario-name"
        name="name"
        placeholder="e.g., Current Situation, After Raise, etc."
        bind:value={newScenarioName}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const target = e.currentTarget as HTMLElement;
            const form = target.closest('form');
            if (form) form.requestSubmit();
          }
        }}
      />
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" color="gray" onclick={() => (showNewScenarioModal = false)}>
        Cancel
      </Button>
      <Button type="submit" disabled={!newScenarioName.trim()}>Create</Button>
    </div>
  </form>
</Modal>

<!-- Delete Scenario Confirmation Modal -->
<Modal bind:open={showDeleteScenarioModal} title="Delete Scenario">
  {#if scenarioToDelete}
    <form
      {...deletePaydownScenario.enhance(async ({ submit }) => {
        await submit();
        handleDeleteScenarioConfirm();
      })}
      class="flex flex-col gap-4"
    >
      <input type="hidden" name="scenarioId" value={scenarioToDelete.id} />
      <P size="base">
        Are you sure you want to delete "{scenarioToDelete.name}"? All debts, incomes, and expenses
        in this scenario will be permanently deleted.
      </P>
      <div class="flex justify-end gap-2">
        <Button type="button" color="gray" onclick={handleDeleteScenarioCancel}>Cancel</Button>
        <Button type="submit" color="red">Delete</Button>
      </div>
    </form>
  {/if}
</Modal>
