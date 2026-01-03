<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, P, Datepicker, Input, Hr, Select, Modal, Label } from 'flowbite-svelte';
  import { QuestionCircleOutline } from 'flowbite-svelte-icons';
  import {
    getAllDebts,
    getAllIncomes,
    getAllRecurringExpenses,
    getAllScenarios,
    getActiveScenarioId,
    setActiveScenarioId,
    getAllSavedPlans,
    createSavedPlan,
    updateSavedPlan,
    type PaydownDebt,
    type MonthlyIncome,
    type RecurringExpense,
    type PaydownScenario,
    type SavedPlan,
  } from '../helpers/localStorage';
  import {
    generateSnowballPlan,
    recalculatePlanFromMonth,
    type MonthlyPaymentPlan,
  } from '../helpers/paydownPlan';
  import PaymentPlanGrid from './PaymentPlanGrid.svelte';

  import DeleteIcon from '$lib/components/DeleteIcon.svelte';

  type Props = {
    savedPlanId?: string | null;
    onSavedPlanUpdate?: (planId: string) => void;
    onPlanSaved?: (planId: string) => void;
    onDeletePlan?: () => void;
  };

  let { savedPlanId = null, onSavedPlanUpdate, onPlanSaved, onDeletePlan }: Props = $props();

  // Plan generation fields
  let planStartDate = $state<Date>(new Date());
  let yearsToPlan = $state(5);
  let additionalSnowball = $state('');

  // Scenario management
  let scenarios = $state<PaydownScenario[]>([]);
  let selectedScenarioId = $state<string | null>(null);

  // Data from localStorage (based on selected scenario)
  let debts = $state<PaydownDebt[]>([]);
  let incomes = $state<MonthlyIncome[]>([]);
  let recurringExpenses = $state<RecurringExpense[]>([]);

  // Payment plan state
  let paymentPlan = $state<MonthlyPaymentPlan[]>([]);
  let editedPayments = $state<Record<number, Record<string, number>>>({});
  let originalPayments = $state<Record<number, Record<string, number>>>({});
  let manuallyEditedPayments = $state<Record<number, Record<string, number>>>({});

  // Income editing state
  let editedIncomes = $state<Record<number, Record<string, number>>>({});
  let originalIncomes = $state<Record<number, Record<string, number>>>({});
  let manuallyEditedIncomes = $state<Record<number, Record<string, number>>>({});

  // Recurring expense editing state
  let editedRecurringExpenses = $state<Record<number, Record<string, number>>>({});
  let originalRecurringExpenses = $state<Record<number, Record<string, number>>>({});
  let manuallyEditedRecurringExpenses = $state<Record<number, Record<string, number>>>({});

  // Saved plan state
  let currentSavedPlanId = $state<string | null>(savedPlanId);
  let showSavePlanModal = $state(false);
  let savePlanName = $state('');
  let isViewingSavedPlan = $derived(currentSavedPlanId !== null);

  function loadScenarios() {
    scenarios = getAllScenarios();
    const activeId = getActiveScenarioId();
    if (activeId && scenarios.some((s) => s.id === activeId)) {
      selectedScenarioId = activeId;
    } else if (scenarios.length > 0) {
      selectedScenarioId = scenarios[0].id;
      setActiveScenarioId(scenarios[0].id);
    } else {
      selectedScenarioId = null;
    }
  }

  function loadDataForScenario(scenarioId: string | null) {
    if (!scenarioId) {
      debts = [];
      incomes = [];
      recurringExpenses = [];
      return;
    }

    // Set the scenario as active so getAll* functions work correctly
    setActiveScenarioId(scenarioId);
    debts = getAllDebts();
    incomes = getAllIncomes();
    recurringExpenses = getAllRecurringExpenses();
  }

  function handleScenarioChange(scenarioId: string) {
    selectedScenarioId = scenarioId;
    setActiveScenarioId(scenarioId);
    loadDataForScenario(scenarioId);
    // Clear plan when switching scenarios (unless viewing saved plan)
    if (!isViewingSavedPlan) {
      paymentPlan = [];
      editedPayments = {};
      originalPayments = {};
      manuallyEditedPayments = {};
      editedIncomes = {};
      originalIncomes = {};
      manuallyEditedIncomes = {};
      editedRecurringExpenses = {};
      originalRecurringExpenses = {};
      manuallyEditedRecurringExpenses = {};
      currentSavedPlanId = null;
    }
  }

  function handleGeneratePlan() {
    if (debts.length === 0) return;

    const startDate = planStartDate ? new Date(planStartDate) : new Date();
    const additionalSnowballAmount = parseFloat(additionalSnowball) || 0;

    // Generate plan
    const newPlan = generateSnowballPlan(
      debts,
      startDate,
      yearsToPlan,
      additionalSnowballAmount,
      incomes,
      recurringExpenses,
    );

    // Clear edited payments when generating new plan BEFORE updating paymentPlan
    editedPayments = {};
    originalPayments = {};
    manuallyEditedPayments = {};
    editedIncomes = {};
    originalIncomes = {};
    manuallyEditedIncomes = {};
    editedRecurringExpenses = {};
    originalRecurringExpenses = {};
    manuallyEditedRecurringExpenses = {};

    // Clear saved plan ID when generating new plan
    currentSavedPlanId = null;

    // Update paymentPlan last, after clearing all related state
    paymentPlan = newPlan;
  }

  function handlePaymentChange(monthIndex: number, debtId: string, value: string) {
    // Treat empty string as 0
    const paymentValue = value === '' ? 0 : parseFloat(value) || 0;

    // Store original value if not already stored
    if (!originalPayments[monthIndex]) {
      originalPayments[monthIndex] = {};
      // Store all original payments for this month
      const monthPlan = paymentPlan[monthIndex];
      if (monthPlan) {
        monthPlan.debtPayments.forEach((dp) => {
          originalPayments[monthIndex][dp.debtId] = dp.payment;
        });
      }
      // Trigger reactivity
      originalPayments = { ...originalPayments };
    }

    // Initialize month edits if needed and create new object to trigger reactivity
    if (!editedPayments[monthIndex]) {
      editedPayments[monthIndex] = {};
    }

    // Store the edited value in a new object to ensure reactivity
    editedPayments = {
      ...editedPayments,
      [monthIndex]: {
        ...editedPayments[monthIndex],
        [debtId]: paymentValue,
      },
    };
  }

  function handleIncomeChange(monthIndex: number, incomeId: string, value: string) {
    // Treat empty string as 0
    const incomeValue = value === '' ? 0 : parseFloat(value) || 0;

    // Store original value if not already stored
    if (!originalIncomes[monthIndex]) {
      originalIncomes[monthIndex] = {};
      // Store all original incomes for this month
      const monthPlan = paymentPlan[monthIndex];
      if (monthPlan) {
        monthPlan.incomes.forEach((income) => {
          originalIncomes[monthIndex][income.id] = income.amount;
        });
      }
      // Trigger reactivity
      originalIncomes = { ...originalIncomes };
    }

    // Initialize month edits if needed and create new object to trigger reactivity
    if (!editedIncomes[monthIndex]) {
      editedIncomes[monthIndex] = {};
    }

    // Store the edited value in a new object to ensure reactivity
    editedIncomes = {
      ...editedIncomes,
      [monthIndex]: {
        ...editedIncomes[monthIndex],
        [incomeId]: incomeValue,
      },
    };
  }

  function handleRecurringExpenseChange(monthIndex: number, expenseId: string, value: string) {
    // Treat empty string as 0
    const expenseValue = value === '' ? 0 : parseFloat(value) || 0;

    // Store original value if not already stored
    if (!originalRecurringExpenses[monthIndex]) {
      originalRecurringExpenses[monthIndex] = {};
      // Store all original recurring expenses for this month
      const monthPlan = paymentPlan[monthIndex];
      if (monthPlan) {
        monthPlan.recurringExpenses.forEach((expense) => {
          originalRecurringExpenses[monthIndex][expense.id] = expense.amount;
        });
      }
      // Trigger reactivity
      originalRecurringExpenses = { ...originalRecurringExpenses };
    }

    // Initialize month edits if needed and create new object to trigger reactivity
    if (!editedRecurringExpenses[monthIndex]) {
      editedRecurringExpenses[monthIndex] = {};
    }

    // Store the edited value in a new object to ensure reactivity
    editedRecurringExpenses = {
      ...editedRecurringExpenses,
      [monthIndex]: {
        ...editedRecurringExpenses[monthIndex],
        [expenseId]: expenseValue,
      },
    };
  }

  function handleUpdateMonth(monthIndex: number) {
    const hasPaymentEdits =
      editedPayments[monthIndex] && Object.keys(editedPayments[monthIndex]).length > 0;
    const hasIncomeEdits =
      editedIncomes[monthIndex] && Object.keys(editedIncomes[monthIndex]).length > 0;
    const hasExpenseEdits =
      editedRecurringExpenses[monthIndex] &&
      Object.keys(editedRecurringExpenses[monthIndex]).length > 0;

    if (!hasPaymentEdits && !hasIncomeEdits && !hasExpenseEdits) return;

    // Save payment edits to the persistent manually edited payments tracker
    if (hasPaymentEdits) {
      const monthEdits = editedPayments[monthIndex];
      if (!manuallyEditedPayments[monthIndex]) {
        manuallyEditedPayments[monthIndex] = {};
      }
      Object.entries(monthEdits).forEach(([debtId, payment]) => {
        manuallyEditedPayments[monthIndex][debtId] = payment;
      });
      manuallyEditedPayments = { ...manuallyEditedPayments };
    }

    // Save income edits to the persistent manually edited incomes tracker
    if (hasIncomeEdits) {
      const monthIncomeEdits = editedIncomes[monthIndex];
      if (!manuallyEditedIncomes[monthIndex]) {
        manuallyEditedIncomes[monthIndex] = {};
      }
      Object.entries(monthIncomeEdits).forEach(([incomeId, amount]) => {
        manuallyEditedIncomes[monthIndex][incomeId] = amount;
      });
      manuallyEditedIncomes = { ...manuallyEditedIncomes };
    }

    // Save recurring expense edits to the persistent manually edited expenses tracker
    if (hasExpenseEdits) {
      const monthExpenseEdits = editedRecurringExpenses[monthIndex];
      if (!manuallyEditedRecurringExpenses[monthIndex]) {
        manuallyEditedRecurringExpenses[monthIndex] = {};
      }
      Object.entries(monthExpenseEdits).forEach(([expenseId, amount]) => {
        manuallyEditedRecurringExpenses[monthIndex][expenseId] = amount;
      });
      manuallyEditedRecurringExpenses = { ...manuallyEditedRecurringExpenses };
    }

    // Merge current payment edits with any previously saved edits for this month
    const allMonthEdits = hasPaymentEdits
      ? {
          ...(manuallyEditedPayments[monthIndex] || {}),
          ...editedPayments[monthIndex], // Current edits override previous ones if there's a conflict
        }
      : {};

    // Convert to Map<string, number> for the function
    const updatedPayments = new Map<string, number>();
    Object.entries(allMonthEdits).forEach(([debtId, payment]) => {
      updatedPayments.set(debtId, payment);
    });

    // Merge current income edits with any previously saved edits for this month
    const allMonthIncomeEdits = hasIncomeEdits
      ? {
          ...(manuallyEditedIncomes[monthIndex] || {}),
          ...editedIncomes[monthIndex],
        }
      : {};

    // Update manuallyEditedIncomes to include current month edits
    if (hasIncomeEdits) {
      manuallyEditedIncomes[monthIndex] = allMonthIncomeEdits;
      manuallyEditedIncomes = { ...manuallyEditedIncomes };
    }

    // Merge current expense edits with any previously saved edits for this month
    const allMonthExpenseEdits = hasExpenseEdits
      ? {
          ...(manuallyEditedRecurringExpenses[monthIndex] || {}),
          ...editedRecurringExpenses[monthIndex],
        }
      : {};

    // Update manuallyEditedRecurringExpenses to include current month edits
    if (hasExpenseEdits) {
      manuallyEditedRecurringExpenses[monthIndex] = allMonthExpenseEdits;
      manuallyEditedRecurringExpenses = { ...manuallyEditedRecurringExpenses };
    }

    const additionalSnowballAmount = parseFloat(additionalSnowball) || 0;

    // Recalculate from this month forward, preserving manually edited payments, incomes, and expenses in future months
    paymentPlan = recalculatePlanFromMonth(
      paymentPlan,
      monthIndex,
      updatedPayments,
      debts,
      incomes,
      recurringExpenses,
      additionalSnowballAmount,
      manuallyEditedPayments,
      manuallyEditedIncomes,
      manuallyEditedRecurringExpenses,
    );

    // Clear temporary edits for this month after update (but keep manuallyEdited*)
    if (hasPaymentEdits) {
      delete editedPayments[monthIndex];
      delete originalPayments[monthIndex];
      editedPayments = { ...editedPayments };
      originalPayments = { ...originalPayments };
    }
    if (hasIncomeEdits) {
      delete editedIncomes[monthIndex];
      delete originalIncomes[monthIndex];
      editedIncomes = { ...editedIncomes };
      originalIncomes = { ...originalIncomes };
    }
    if (hasExpenseEdits) {
      delete editedRecurringExpenses[monthIndex];
      delete originalRecurringExpenses[monthIndex];
      editedRecurringExpenses = { ...editedRecurringExpenses };
      originalRecurringExpenses = { ...originalRecurringExpenses };
    }

    // Update saved plan if viewing one
    if (currentSavedPlanId) {
      updateSavedPlan(currentSavedPlanId, {
        debts,
        incomes,
        recurringExpenses,
        paymentPlan,
        manuallyEditedPayments,
        manuallyEditedIncomes,
        manuallyEditedRecurringExpenses,
      });
      onSavedPlanUpdate?.(currentSavedPlanId);
    }
  }

  function getEditedPayment(monthIndex: number, debtId: string): number | undefined {
    return editedPayments[monthIndex]?.[debtId];
  }

  function getDisplayPayment(monthIndex: number, debtId: string, currentPayment: number): number {
    // If there's an edited value, use that
    const edited = getEditedPayment(monthIndex, debtId);
    if (edited !== undefined) {
      return edited;
    }
    // If we've started editing this month, use the stored original value
    // This ensures fields are independent until Update is clicked
    if (originalPayments[monthIndex]?.[debtId] !== undefined) {
      return originalPayments[monthIndex][debtId];
    }
    // Otherwise, use the current payment from the plan (for months not yet edited)
    return currentPayment;
  }

  function getDisplayIncome(monthIndex: number, incomeId: string, currentAmount: number): number {
    // If there's an edited value, use that
    const edited = editedIncomes[monthIndex]?.[incomeId];
    if (edited !== undefined) {
      return edited;
    }
    // If we've started editing this month, use the stored original value
    if (originalIncomes[monthIndex]?.[incomeId] !== undefined) {
      return originalIncomes[monthIndex][incomeId];
    }
    // Otherwise, use the current amount from the plan
    return currentAmount;
  }

  function getDisplayRecurringExpense(
    monthIndex: number,
    expenseId: string,
    currentAmount: number,
  ): number {
    // If there's an edited value, use that
    const edited = editedRecurringExpenses[monthIndex]?.[expenseId];
    if (edited !== undefined) {
      return edited;
    }
    // If we've started editing this month, use the stored original value
    if (originalRecurringExpenses[monthIndex]?.[expenseId] !== undefined) {
      return originalRecurringExpenses[monthIndex][expenseId];
    }
    // Otherwise, use the current amount from the plan
    return currentAmount;
  }

  function hasEdits(monthIndex: number): boolean {
    // Check payment edits
    if (editedPayments[monthIndex]) {
      const monthEdits = editedPayments[monthIndex];
      const originals = originalPayments[monthIndex];

      if (originals) {
        for (const [debtId, editedValue] of Object.entries(monthEdits)) {
          const originalValue = originals[debtId];
          if (originalValue !== undefined && Math.abs(editedValue - originalValue) > 0.01) {
            return true;
          }
        }
      }
    }

    // Check income edits
    if (editedIncomes[monthIndex]) {
      const monthEdits = editedIncomes[monthIndex];
      const originals = originalIncomes[monthIndex];

      if (originals) {
        for (const [incomeId, editedValue] of Object.entries(monthEdits)) {
          const originalValue = originals[incomeId];
          if (originalValue !== undefined && Math.abs(editedValue - originalValue) > 0.01) {
            return true;
          }
        }
      }
    }

    // Check recurring expense edits
    if (editedRecurringExpenses[monthIndex]) {
      const monthEdits = editedRecurringExpenses[monthIndex];
      const originals = originalRecurringExpenses[monthIndex];

      if (originals) {
        for (const [expenseId, editedValue] of Object.entries(monthEdits)) {
          const originalValue = originals[expenseId];
          if (originalValue !== undefined && Math.abs(editedValue - originalValue) > 0.01) {
            return true;
          }
        }
      }
    }

    return false;
  }

  function handleSavePlan() {
    if (paymentPlan.length === 0) return;
    showSavePlanModal = true;
  }

  function confirmSavePlan() {
    if (!savePlanName.trim() || paymentPlan.length === 0) return;

    try {
      const savedPlan = createSavedPlan(savePlanName.trim(), {
        debts: [...debts],
        incomes: [...incomes],
        recurringExpenses: [...recurringExpenses],
        planStartDate,
        yearsToPlan,
        additionalSnowball: parseFloat(additionalSnowball) || 0,
        paymentPlan: [...paymentPlan],
        manuallyEditedPayments: { ...manuallyEditedPayments },
        manuallyEditedIncomes: { ...manuallyEditedIncomes },
        manuallyEditedRecurringExpenses: { ...manuallyEditedRecurringExpenses },
      });

      showSavePlanModal = false;
      savePlanName = '';

      // If not viewing a saved plan, clear the generate plan view and notify parent
      if (!isViewingSavedPlan) {
        // Clear the plan state
        paymentPlan = [];
        editedPayments = {};
        originalPayments = {};
        manuallyEditedPayments = {};
        editedIncomes = {};
        originalIncomes = {};
        manuallyEditedIncomes = {};
        editedRecurringExpenses = {};
        originalRecurringExpenses = {};
        manuallyEditedRecurringExpenses = {};
        currentSavedPlanId = null;

        // Notify parent to switch to saved plans tab and load the new plan
        onPlanSaved?.(savedPlan.id);
      } else {
        // If viewing a saved plan, just update it
        currentSavedPlanId = savedPlan.id;
        onSavedPlanUpdate?.(savedPlan.id);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save plan');
    }
  }

  function loadSavedPlan(plan: SavedPlan) {
    // Load base scenario inputs
    debts = [...plan.debts];
    incomes = [...plan.incomes];
    recurringExpenses = [...plan.recurringExpenses];

    // Load plan generation parameters
    planStartDate = new Date(plan.planStartDate);
    yearsToPlan = plan.yearsToPlan;
    additionalSnowball = plan.additionalSnowball.toString();

    // Load payment plan
    paymentPlan = [...plan.paymentPlan];

    // Load manual edits
    manuallyEditedPayments = JSON.parse(JSON.stringify(plan.manuallyEditedPayments));
    manuallyEditedIncomes = JSON.parse(JSON.stringify(plan.manuallyEditedIncomes));
    manuallyEditedRecurringExpenses = JSON.parse(
      JSON.stringify(plan.manuallyEditedRecurringExpenses),
    );

    // Clear temporary edits
    editedPayments = {};
    originalPayments = {};
    editedIncomes = {};
    originalIncomes = {};
    editedRecurringExpenses = {};
    originalRecurringExpenses = {};

    currentSavedPlanId = plan.id;
  }

  function loadPlanIfNeeded() {
    if (savedPlanId) {
      const plan = getAllSavedPlans().find((p) => p.id === savedPlanId);
      if (plan) {
        loadSavedPlan(plan);
      }
    }
  }

  // Watch for savedPlanId prop changes
  $effect(() => {
    if (savedPlanId) {
      loadPlanIfNeeded();
    } else {
      // Clear saved plan state if prop is cleared
      currentSavedPlanId = null;
      paymentPlan = [];
      editedPayments = {};
      originalPayments = {};
      manuallyEditedPayments = {};
      editedIncomes = {};
      originalIncomes = {};
      manuallyEditedIncomes = {};
      editedRecurringExpenses = {};
      originalRecurringExpenses = {};
      manuallyEditedRecurringExpenses = {};
    }
  });

  onMount(() => {
    // If savedPlanId prop is provided, load that saved plan first (skip scenario loading)
    if (savedPlanId) {
      loadPlanIfNeeded();
      return; // Don't load scenarios when viewing saved plan
    }

    // Otherwise, load scenarios normally
    loadScenarios();
    if (selectedScenarioId) {
      loadDataForScenario(selectedScenarioId);
    }
  });
</script>

<div class="flex w-full flex-col gap-4">
  <!-- Scenario Selector (hidden when viewing saved plan) -->
  {#if !isViewingSavedPlan && scenarios.length > 0}
    <div
      class="rounded-lg border-2 border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
    >
      <div class="flex items-center gap-3">
        <P size="sm" class="w-32 font-semibold">Base Scenario:</P>
        <Select
          items={scenarios.map((s) => ({ value: s.id, name: s.name }))}
          bind:value={selectedScenarioId}
          onchange={() => {
            if (selectedScenarioId) {
              handleScenarioChange(selectedScenarioId);
            }
          }}
          class="flex-1"
        />
      </div>
    </div>
  {/if}

  {#if isViewingSavedPlan}
    <!-- Saved Plan Details Display -->
    <div
      class="rounded-lg border-2 border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        <div class="flex items-center gap-2">
          <P size="sm" class="w-24 font-semibold">Start Date:</P>
          <P size="sm" class="text-neutral-700 dark:text-neutral-300">
            {planStartDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </P>
        </div>
        <div class="flex items-center gap-2">
          <P size="sm" class="w-32 font-semibold">Years to Plan:</P>
          <P size="sm" class="text-neutral-700 dark:text-neutral-300">{yearsToPlan}</P>
        </div>
        <div class="flex items-center gap-2">
          <P size="sm" class="w-40 font-semibold">Additional Snowball:</P>
          <P size="sm" class="text-neutral-700 dark:text-neutral-300">
            ${parseFloat(additionalSnowball || '0').toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </P>
        </div>
        {#if onDeletePlan}
          <div class="ml-auto">
            <DeleteIcon onclick={onDeletePlan} ariaLabel="Delete saved plan" />
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Plan Generation Inputs -->
    <div class="flex w-full flex-col gap-4 p-4">
      <div class="flex w-76 flex-col justify-start gap-4 lg:w-full lg:flex-row">
        <div class="flex items-center gap-2">
          <P size="sm" class="w-24">Start Date:</P>
          <Datepicker class="z-1000" color="primary" bind:value={planStartDate} autohide />
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1">
            <div class="group relative">
              <QuestionCircleOutline
                class="h-4 w-4 cursor-help text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                aria-label="Help"
              />
              <div
                class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-neutral-700"
                role="tooltip"
              >
                Maximum projected years allowed is 20
                <div
                  class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-700"
                ></div>
              </div>
            </div>
            <P size="sm" class="w-38">Years to Plan:</P>
          </div>
          <Input
            type="number"
            bind:value={yearsToPlan}
            min="1"
            max="20"
            oninput={(e) => {
              const target = e.currentTarget as HTMLInputElement;
              if (!target) return;
              const value = parseInt(target.value) || 0;
              if (value > 20) {
                yearsToPlan = 20;
              } else if (value < 1) {
                yearsToPlan = 1;
              } else {
                yearsToPlan = value;
              }
            }}
          />
        </div>
        <div class="flex items-center gap-2">
          <P size="sm" class="w-52">Additional Snowball:</P>
          <Input
            type="number"
            bind:value={additionalSnowball}
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>
        <Button onclick={handleGeneratePlan}>Generate Plan</Button>
        {#if paymentPlan.length > 0}
          <Button onclick={handleSavePlan} color="green">Save Plan</Button>
        {/if}
      </div>
    </div>
  {/if}
  <Hr class="my-4" />
  <PaymentPlanGrid
    {paymentPlan}
    {debts}
    {hasEdits}
    {handleUpdateMonth}
    {getDisplayPayment}
    {handlePaymentChange}
    {getDisplayIncome}
    {handleIncomeChange}
    {getDisplayRecurringExpense}
    {handleRecurringExpenseChange}
  />

  <!-- Save Plan Modal -->
  <Modal bind:open={showSavePlanModal} title="Save Plan">
    <div class="flex flex-col gap-4">
      <P size="sm" class="text-neutral-600 dark:text-neutral-400">
        Save this payment plan with all its inputs and edits. You can save up to 5 plans.
      </P>
      <div>
        <Label for="save-plan-name" class="mb-2 block">Plan Name</Label>
        <Input
          id="save-plan-name"
          placeholder="e.g., Aggressive Paydown, Conservative Plan, etc."
          bind:value={savePlanName}
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              confirmSavePlan();
            }
          }}
        />
      </div>
      <div class="flex justify-end gap-2">
        <Button color="gray" onclick={() => (showSavePlanModal = false)}>Cancel</Button>
        <Button onclick={confirmSavePlan} disabled={!savePlanName.trim()}>Save</Button>
      </div>
    </div>
  </Modal>
</div>
