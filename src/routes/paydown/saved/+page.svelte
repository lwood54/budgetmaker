<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, P, Select, Modal } from 'flowbite-svelte';
  import GeneratePlan from '../components/GeneratePlan.svelte';
  import { getAllSavedPlans, deleteSavedPlan, type SavedPlan } from '../helpers';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  // Saved Plans state
  let savedPlans = $state<SavedPlan[]>([]);
  let selectedSavedPlanId = $state<string | null>(null);
  let showDeleteModal = $state(false);
  let planToDelete = $state<SavedPlan | null>(null);

  function loadSavedPlans() {
    savedPlans = getAllSavedPlans();
  }

  function handleSavedPlanChange(planId: string | null) {
    selectedSavedPlanId = planId;
    // Update URL without navigation
    if (planId) {
      goto(`/paydown/saved?plan=${planId}`, { replaceState: true, noScroll: true });
    } else {
      goto('/paydown/saved', { replaceState: true, noScroll: true });
    }
  }

  function handleSavedPlanUpdate(planId: string) {
    loadSavedPlans();
    // Keep the same plan selected
    selectedSavedPlanId = planId;
  }

  function handleDeleteClick(plan: SavedPlan) {
    planToDelete = plan;
    showDeleteModal = true;
  }

  function handleDeleteConfirm() {
    if (!planToDelete) return;

    deleteSavedPlan(planToDelete.id);
    loadSavedPlans();

    // Clear selection if we deleted the selected plan
    if (selectedSavedPlanId === planToDelete.id) {
      selectedSavedPlanId = null;
    }

    // Close modal and switch to generate plan tab
    showDeleteModal = false;
    planToDelete = null;
    goto('/paydown/generate');
  }

  function handleDeleteCancel() {
    showDeleteModal = false;
    planToDelete = null;
  }

  onMount(() => {
    loadSavedPlans();
    // Check if there's a plan ID in the URL query params
    const planId = page.url.searchParams.get('plan');
    if (planId) {
      const plan = savedPlans.find((p) => p.id === planId);
      if (plan) {
        selectedSavedPlanId = planId;
      }
    }
  });

  // Watch for URL changes (e.g., when navigating from generate page after saving)
  $effect(() => {
    const planId = page.url.searchParams.get('plan');
    if (planId && savedPlans.length > 0) {
      const plan = savedPlans.find((p) => p.id === planId);
      if (plan && selectedSavedPlanId !== planId) {
        selectedSavedPlanId = planId;
      }
    }
  });
</script>

<div class="flex w-full flex-col gap-4">
  {#if savedPlans.length > 0}
    <div
      class="rounded-lg border-2 border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
    >
      <div class="flex items-center gap-3">
        <P size="sm" class="w-32 font-semibold">Select Plan:</P>
        <Select
          items={savedPlans.map((p) => ({ value: p.id, name: p.name }))}
          bind:value={selectedSavedPlanId}
          onchange={() => {
            handleSavedPlanChange(selectedSavedPlanId);
          }}
          class="flex-1"
        />
      </div>
    </div>
    {#if selectedSavedPlanId}
      {@const selectedPlan = savedPlans.find((p) => p.id === selectedSavedPlanId)}
      {#if selectedPlan}
        {#key selectedSavedPlanId}
          <GeneratePlan
            savedPlanId={selectedSavedPlanId}
            onSavedPlanUpdate={handleSavedPlanUpdate}
            onDeletePlan={() => handleDeleteClick(selectedPlan)}
          />
        {/key}
      {/if}
    {/if}
  {:else}
    <div
      class="flex flex-col items-center justify-center rounded-lg border-2 border-neutral-300 p-8 dark:border-neutral-700"
    >
      <P size="base" class="text-neutral-600 dark:text-neutral-400"
        >No saved plans yet. Generate a plan and click "Save Plan" to save it here.</P
      >
    </div>
  {/if}
</div>

<!-- Delete Plan Confirmation Modal -->
<Modal bind:open={showDeleteModal} title="Delete Saved Plan">
  <div class="flex flex-col gap-4">
    <P size="base">
      Are you sure you want to delete this saved plan? This action cannot be undone.
    </P>
    {#if planToDelete}
      <P size="lg" class="font-semibold text-neutral-900 dark:text-neutral-100">
        {planToDelete.name}
      </P>
    {/if}
    <div class="flex justify-end gap-2">
      <Button color="gray" onclick={handleDeleteCancel}>Cancel</Button>
      <Button color="red" onclick={handleDeleteConfirm}>Delete</Button>
    </div>
  </div>
</Modal>
