<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, P, Input, Modal, Label } from 'flowbite-svelte';
  import Select from '$lib/components/Select.svelte';
  import DeleteIcon from '$lib/components/DeleteIcon.svelte';

  import {
    type PaydownDebt,
    type MonthlyIncome,
    type RecurringExpense,
    getAllScenarios,
    getActiveScenarioId,
    setActiveScenarioId,
    createScenario,
    deleteScenario,
    type PaydownScenario,
  } from '../helpers';
  import AddDebtDrawer from './AddDebtDrawer.svelte';
  import AddIncomeDrawer from './AddIncomeDrawer.svelte';
  import AddRecurringExpenseDrawer from './AddRecurringExpenseDrawer.svelte';
  import IncomesColumn from './IncomesColumn.svelte';
  import DebtsColumn from './DebtsColumn.svelte';
  import RecurringExpensesColumn from './RecurringExpensesColumn.svelte';

  let debtDrawerOpen = $state(false);
  let incomeDrawerOpen = $state(false);
  let recurringExpensesDrawerOpen = $state(false);

  // Scenario management
  let scenarios = $state<PaydownScenario[]>([]);
  let activeScenarioId = $state<string | null>(null);
  let newScenarioName = $state('');
  let showNewScenarioModal = $state(false);
  let showDeleteScenarioModal = $state(false);
  let scenarioToDelete = $state<PaydownScenario | null>(null);

  // Edit state
  let editingDebt = $state<PaydownDebt | null>(null);
  let editingIncome = $state<MonthlyIncome | null>(null);
  let editingExpense = $state<RecurringExpense | null>(null);

  const canCreateScenario = $derived(scenarios.length < 5);
  const activeScenario = $derived(scenarios.find((s) => s.id === activeScenarioId) || null);

  function loadScenarios() {
    scenarios = getAllScenarios();
    activeScenarioId = getActiveScenarioId();
  }

  let previousScenarioId = $state<string | null>(null);

  // Watch for changes in activeScenarioId from Select dropdown
  $effect(() => {
    if (activeScenarioId && activeScenarioId !== previousScenarioId) {
      previousScenarioId = activeScenarioId;
      setActiveScenarioId(activeScenarioId);
      // Dispatch event to refresh components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('paydown-data-changed'));
      }
    }
  });

  function handleCreateScenario() {
    if (!newScenarioName.trim()) return;
    try {
      const newScenario = createScenario(newScenarioName.trim());
      loadScenarios();
      setActiveScenarioId(newScenario.id);
      activeScenarioId = newScenario.id;
      newScenarioName = '';
      showNewScenarioModal = false;
      // Dispatch event to refresh components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('paydown-data-changed'));
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create scenario');
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

  function handleDeleteScenarioClick(scenario: PaydownScenario) {
    scenarioToDelete = scenario;
    showDeleteScenarioModal = true;
  }

  function handleDeleteScenarioConfirm() {
    if (!scenarioToDelete) return;

    const deletedId = scenarioToDelete.id;
    deleteScenario(deletedId);
    loadScenarios();

    // deleteScenario already handles setting a new active scenario if needed
    // Just refresh the activeScenarioId from storage
    activeScenarioId = getActiveScenarioId();

    // Dispatch event to refresh components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paydown-data-changed'));
    }

    showDeleteScenarioModal = false;
    scenarioToDelete = null;
  }

  function handleDeleteScenarioCancel() {
    showDeleteScenarioModal = false;
    scenarioToDelete = null;
  }

  onMount(() => {
    loadScenarios();
  });
</script>

<div class="mb-6 flex items-center gap-3">
  <Select
    items={scenarios.map((s) => ({ value: s.id, name: s.name }))}
    bind:value={activeScenarioId}
    placeholder="Select a scenario"
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
  <div class="flex w-full flex-col gap-8 lg:flex-row lg:items-start">
    <IncomesColumn
      onAddClick={() => {
        editingIncome = null;
        incomeDrawerOpen = true;
      }}
      onDelete={() => {}}
      onEdit={handleEditIncome}
    />
    <DebtsColumn
      onAddClick={() => {
        editingDebt = null;
        debtDrawerOpen = true;
      }}
      onDelete={() => {}}
      onEdit={handleEditDebt}
    />
    <RecurringExpensesColumn
      onAddClick={() => {
        editingExpense = null;
        recurringExpensesDrawerOpen = true;
      }}
      onDelete={() => {}}
      onEdit={handleEditRecurringExpense}
    />
  </div>
</div>

<AddDebtDrawer
  bind:open={debtDrawerOpen}
  bind:editingDebt
  onSuccess={() => {
    editingDebt = null;
    // Dispatch event to refresh components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paydown-data-changed'));
    }
  }}
/>
<AddIncomeDrawer
  bind:open={incomeDrawerOpen}
  bind:editingIncome
  onSuccess={() => {
    editingIncome = null;
    // Dispatch event to refresh components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paydown-data-changed'));
    }
  }}
/>
<AddRecurringExpenseDrawer
  bind:open={recurringExpensesDrawerOpen}
  bind:editingExpense
  onSuccess={() => {
    editingExpense = null;
    // Dispatch event to refresh components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('paydown-data-changed'));
    }
  }}
/>

<Modal bind:open={showNewScenarioModal} title="Create New Scenario">
  <div class="flex flex-col gap-4">
    <P size="sm" class="text-neutral-600 dark:text-neutral-400">
      Create a new scenario to plan different financial situations.
    </P>
    <div>
      <Label for="new-scenario-name" class="mb-2 block">Scenario Name</Label>
      <Input
        id="new-scenario-name"
        placeholder="e.g., Current Situation, After Raise, etc."
        bind:value={newScenarioName}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            handleCreateScenario();
          }
        }}
      />
    </div>
    <div class="flex justify-end gap-2">
      <Button color="gray" onclick={() => (showNewScenarioModal = false)}>Cancel</Button>
      <Button onclick={handleCreateScenario} disabled={!newScenarioName.trim()}>Create</Button>
    </div>
  </div>
</Modal>

<!-- Delete Scenario Confirmation Modal -->
<Modal bind:open={showDeleteScenarioModal} title="Delete Scenario">
  <div class="flex flex-col gap-4">
    <P size="base">
      Are you sure you want to delete "{scenarioToDelete?.name}"? All debts, incomes, and expenses
      in this scenario will be permanently deleted.
    </P>
    <div class="flex justify-end gap-2">
      <Button color="gray" onclick={handleDeleteScenarioCancel}>Cancel</Button>
      <Button color="red" onclick={handleDeleteScenarioConfirm}>Delete</Button>
    </div>
  </div>
</Modal>
