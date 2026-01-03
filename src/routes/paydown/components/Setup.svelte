<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, P, Input, Modal, Label } from 'flowbite-svelte';
  import {
    getAllDebts,
    type PaydownDebt,
    deleteDebt,
    getAllIncomes,
    deleteIncome,
    type MonthlyIncome,
    getAllRecurringExpenses,
    deleteRecurringExpense,
    type RecurringExpense,
    getAllScenarios,
    getActiveScenarioId,
    setActiveScenarioId,
    createScenario,
    updateScenario,
    deleteScenario,
    type PaydownScenario,
  } from '../helpers';
  import AddDebtDrawer from './AddDebtDrawer.svelte';
  import AddIncomeDrawer from './AddIncomeDrawer.svelte';
  import AddRecurringExpenseDrawer from './AddRecurringExpenseDrawer.svelte';
  import IncomesColumn from './IncomesColumn.svelte';
  import DebtsColumn from './DebtsColumn.svelte';
  import RecurringExpensesColumn from './RecurringExpensesColumn.svelte';

  let debts = $state<PaydownDebt[]>([]);
  let incomes = $state<MonthlyIncome[]>([]);
  let recurringExpenses = $state<RecurringExpense[]>([]);
  let debtDrawerOpen = $state(false);
  let incomeDrawerOpen = $state(false);
  let recurringExpensesDrawerOpen = $state(false);

  // Scenario management
  let scenarios = $state<PaydownScenario[]>([]);
  let activeScenarioId = $state<string | null>(null);
  let newScenarioName = $state('');
  let showNewScenarioModal = $state(false);
  let editingScenarioId = $state<string | null>(null);
  let editingScenarioName = $state('');
  let showEditScenarioModal = $state(false);
  let showDeleteConfirmModal = $state(false);
  let scenarioToDelete = $state<string | null>(null);

  // Edit state
  let editingDebt = $state<PaydownDebt | null>(null);
  let editingIncome = $state<MonthlyIncome | null>(null);
  let editingExpense = $state<RecurringExpense | null>(null);

  // Calculate totals
  const totalIncome = $derived(incomes.reduce((sum, income) => sum + income.amount, 0));
  const totalDebtAmount = $derived(debts.reduce((sum, debt) => sum + debt.amount, 0));
  const totalMonthlyPayments = $derived(debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0));
  const totalExpenses = $derived(
    recurringExpenses.reduce((sum, expense) => sum + expense.amount, 0),
  );
  const remaining = $derived(totalIncome - totalMonthlyPayments - totalExpenses);

  const canCreateScenario = $derived(scenarios.length < 5);

  function loadScenarios() {
    scenarios = getAllScenarios();
    activeScenarioId = getActiveScenarioId();
  }

  function loadDebts() {
    debts = getAllDebts();
  }

  function loadIncomes() {
    incomes = getAllIncomes();
  }

  function loadRecurringExpenses() {
    recurringExpenses = getAllRecurringExpenses();
  }

  function loadAllData() {
    loadDebts();
    loadIncomes();
    loadRecurringExpenses();
  }

  function handleScenarioChange(scenarioId: string) {
    setActiveScenarioId(scenarioId);
    activeScenarioId = scenarioId;
    loadAllData();
  }

  function handleCreateScenario() {
    if (!newScenarioName.trim()) return;
    try {
      const newScenario = createScenario(newScenarioName.trim());
      loadScenarios();
      setActiveScenarioId(newScenario.id);
      activeScenarioId = newScenario.id;
      newScenarioName = '';
      showNewScenarioModal = false;
      loadAllData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create scenario');
    }
  }

  function handleEditScenario(scenario: PaydownScenario) {
    editingScenarioId = scenario.id;
    editingScenarioName = scenario.name;
    showEditScenarioModal = true;
  }

  function handleSaveScenarioName() {
    if (!editingScenarioId || !editingScenarioName.trim()) return;
    updateScenario(editingScenarioId, { name: editingScenarioName.trim() });
    loadScenarios();
    showEditScenarioModal = false;
    editingScenarioId = null;
    editingScenarioName = '';
  }

  function handleDeleteScenario(scenarioId: string) {
    scenarioToDelete = scenarioId;
    showDeleteConfirmModal = true;
  }

  function confirmDeleteScenario() {
    if (!scenarioToDelete) return;
    deleteScenario(scenarioToDelete);
    loadScenarios();
    loadAllData();
    showDeleteConfirmModal = false;
    scenarioToDelete = null;
  }

  function handleDeleteDebt(id: string) {
    deleteDebt(id);
    loadDebts();
  }

  function handleDeleteIncome(id: string) {
    deleteIncome(id);
    loadIncomes();
  }

  function handleDeleteRecurringExpense(id: string) {
    deleteRecurringExpense(id);
    loadRecurringExpenses();
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

  onMount(() => {
    loadScenarios();
    loadAllData();
  });
</script>

<!-- Scenario Selector -->
<div
  class="mb-6 rounded-lg border-2 border-neutral-300 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50"
>
  <div class="mb-4 flex items-center justify-between">
    <P size="lg" class="font-semibold">Scenarios</P>
    <Button
      size="sm"
      disabled={!canCreateScenario}
      onclick={() => {
        newScenarioName = '';
        showNewScenarioModal = true;
      }}
    >
      New Scenario
    </Button>
  </div>

  {#if scenarios.length > 0}
    <div class="flex flex-col gap-3">
      {#each scenarios as scenario (scenario.id)}
        <div
          role="button"
          tabindex="0"
          class="flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 {activeScenarioId ===
          scenario.id
            ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
            : 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-800'}"
          onclick={() => handleScenarioChange(scenario.id)}
          onkeydown={(e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleScenarioChange(scenario.id);
            }
          }}
        >
          <div class="flex items-center gap-3">
            <input
              type="radio"
              name="scenario"
              checked={activeScenarioId === scenario.id}
              onchange={() => handleScenarioChange(scenario.id)}
              onclick={(e: MouseEvent) => e.stopPropagation()}
              class="text-primary-600 h-4 w-4"
            />
            <P size="base" class="font-semibold">{scenario.name}</P>
            {#if activeScenarioId === scenario.id}
              <P size="xs" class="text-primary-600 dark:text-primary-400">(Active)</P>
            {/if}
          </div>
          <div class="flex gap-2">
            <Button
              size="xs"
              onclick={(e: MouseEvent) => {
                e.stopPropagation();
                handleEditScenario(scenario);
              }}
            >
              Rename
            </Button>
            {#if scenarios.length > 1}
              <Button
                size="xs"
                color="red"
                onclick={(e: MouseEvent) => {
                  e.stopPropagation();
                  handleDeleteScenario(scenario.id);
                }}
              >
                Delete
              </Button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <P size="sm" class="text-neutral-600 dark:text-neutral-400">
      No scenarios yet. Create your first scenario to get started.
    </P>
  {/if}

  {#if !canCreateScenario}
    <P size="xs" class="mt-2 text-neutral-500 dark:text-neutral-400">
      Maximum of 5 scenarios reached. Delete a scenario to create a new one.
    </P>
  {/if}
</div>

<div
  class="mb-6 rounded-lg border-2 border-neutral-300 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50"
>
  <div class="mb-4 flex items-center gap-3">
    <P size="lg" class="font-semibold">Financial Summary</P>
    <P size="sm" class="text-neutral-600 dark:text-neutral-400">
      Total Debt: ${totalDebtAmount.toLocaleString()}
    </P>

    <P
      size="sm"
      class={`font-bold ${
        remaining >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
      }`}
    >
      Remaining: ${remaining.toLocaleString()}
    </P>
  </div>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
    <div
      class="rounded-lg border-2 border-green-500 bg-green-50 p-4 dark:border-green-400 dark:bg-green-900/20"
    >
      <P size="sm" class="text-green-700 dark:text-green-400">Total Monthly Income</P>
      <P size="xl" class="font-bold text-green-700 dark:text-green-400">
        ${totalIncome.toLocaleString()}
      </P>
    </div>

    <div
      class="rounded-lg border-2 border-red-500 bg-red-50 p-4 dark:border-red-400 dark:bg-red-900/20"
    >
      <P size="sm" class="text-red-700 dark:text-red-400">Total Monthly Payments</P>
      <P size="xl" class="font-bold text-red-700 dark:text-red-400">
        ${totalMonthlyPayments.toLocaleString()}
      </P>
    </div>

    <div
      class="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 dark:border-orange-400 dark:bg-orange-900/20"
    >
      <P size="sm" class="text-orange-700 dark:text-orange-400">Total Monthly Expenses</P>
      <P size="xl" class="font-bold text-orange-700 dark:text-orange-400">
        ${totalExpenses.toLocaleString()}
      </P>
    </div>
  </div>
</div>

<div
  class="rounded-lg border-2 border-neutral-300 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50"
>
  <div class="flex w-full flex-col gap-8 lg:flex-row lg:items-start">
    <IncomesColumn
      bind:incomes
      onAddClick={() => {
        editingIncome = null;
        incomeDrawerOpen = true;
      }}
      onDelete={handleDeleteIncome}
      onEdit={handleEditIncome}
    />
    <DebtsColumn
      bind:debts
      onAddClick={() => {
        editingDebt = null;
        debtDrawerOpen = true;
      }}
      onDelete={handleDeleteDebt}
      onEdit={handleEditDebt}
    />
    <RecurringExpensesColumn
      bind:recurringExpenses
      onAddClick={() => {
        editingExpense = null;
        recurringExpensesDrawerOpen = true;
      }}
      onDelete={handleDeleteRecurringExpense}
      onEdit={handleEditRecurringExpense}
    />
  </div>
</div>

<AddDebtDrawer
  bind:open={debtDrawerOpen}
  bind:editingDebt
  onSuccess={() => {
    loadDebts();
    editingDebt = null;
  }}
/>
<AddIncomeDrawer
  bind:open={incomeDrawerOpen}
  bind:editingIncome
  onSuccess={() => {
    loadIncomes();
    editingIncome = null;
  }}
/>
<AddRecurringExpenseDrawer
  bind:open={recurringExpensesDrawerOpen}
  bind:editingExpense
  onSuccess={() => {
    loadRecurringExpenses();
    editingExpense = null;
  }}
/>

<!-- New Scenario Modal -->
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

<!-- Edit Scenario Modal -->
<Modal bind:open={showEditScenarioModal} title="Rename Scenario">
  <div class="flex flex-col gap-4">
    <div>
      <Label for="edit-scenario-name" class="mb-2 block">Scenario Name</Label>
      <Input
        id="edit-scenario-name"
        bind:value={editingScenarioName}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            handleSaveScenarioName();
          }
        }}
      />
    </div>
    <div class="flex justify-end gap-2">
      <Button color="gray" onclick={() => (showEditScenarioModal = false)}>Cancel</Button>
      <Button onclick={handleSaveScenarioName} disabled={!editingScenarioName.trim()}>Save</Button>
    </div>
  </div>
</Modal>

<!-- Delete Confirmation Modal -->
<Modal bind:open={showDeleteConfirmModal} title="Delete Scenario">
  <div class="flex flex-col gap-4">
    <P size="base">
      Are you sure you want to delete this scenario? All debts, incomes, and expenses in this
      scenario will be permanently deleted.
    </P>
    <div class="flex justify-end gap-2">
      <Button color="gray" onclick={() => (showDeleteConfirmModal = false)}>Cancel</Button>
      <Button color="red" onclick={confirmDeleteScenario}>Delete</Button>
    </div>
  </div>
</Modal>
