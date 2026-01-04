<script lang="ts">
  import { Button, P, Modal } from 'flowbite-svelte';
  import Select from '$lib/components/Select.svelte';
  import GeneratePlan from '../components/GeneratePlan.svelte';
  import { getSavedPlans, deletePaydownSavedPlan } from '$lib/api/paydown.remote';
  import { type SavedPlan } from '../helpers';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  // Saved Plans state with remote query
  const savedPlans = $derived((await getSavedPlans()) ?? []);

  let selectedSavedPlanId = $state<string | null>(null);
  let showDeleteModal = $state(false);
  let planToDelete = $state<SavedPlan | null>(null);

  function handleSavedPlanChange(planId: string | null) {
    // Update URL without navigation
    if (planId) {
      goto(`/paydown/saved?plan=${planId}`, { replaceState: true, noScroll: true });
    } else {
      goto('/paydown/saved', { replaceState: true, noScroll: true });
    }
  }

  // Watch for value changes
  $effect(() => {
    if (selectedSavedPlanId !== null) {
      handleSavedPlanChange(selectedSavedPlanId);
    }
  });

  function handleSavedPlanUpdate(planId: string) {
    // Don't refresh - we already have updated data locally
    // Refreshing causes cascading reactive updates and performance issues
    // Keep the same plan selected
    selectedSavedPlanId = planId;
  }

  function handleDeleteClick(plan: SavedPlan) {
    planToDelete = plan;
    showDeleteModal = true;
  }

  function handleDeleteCancel() {
    showDeleteModal = false;
    planToDelete = null;
  }

  // Initialize selected plan from URL
  $effect(() => {
    const planId = page.url.searchParams.get('plan');
    if (planId && savedPlans.length > 0) {
      const plan = savedPlans.find((p) => p.id === planId);
      if (plan && selectedSavedPlanId !== planId) {
        selectedSavedPlanId = planId;
      } else if (!plan && savedPlans.length > 0 && !selectedSavedPlanId) {
        selectedSavedPlanId = savedPlans[0].id;
      }
    } else if (!planId && savedPlans.length > 0 && !selectedSavedPlanId) {
      selectedSavedPlanId = savedPlans[0].id;
    }
  });
</script>

<div class="flex w-full flex-col gap-4">
  {#if savedPlans.length > 0}
    <div class="flex items-center gap-3">
      <Select
        items={savedPlans.map((p) => ({ value: p.id, name: p.name }))}
        bind:value={selectedSavedPlanId}
        class="w-72"
        placeholder="Select Plan"
      />
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
  {#if planToDelete}
    {@const planIdToDelete = planToDelete.id}
    <form
      {...deletePaydownSavedPlan.enhance(async ({ submit }) => {
        await submit();
        getSavedPlans().refresh();
        // Clear selection if we deleted the selected plan
        if (selectedSavedPlanId === planIdToDelete) {
          selectedSavedPlanId = null;
        }
        showDeleteModal = false;
        planToDelete = null;
        goto('/paydown/generate');
      })}
      class="flex flex-col gap-4"
    >
      <input type="hidden" name="planId" value={planIdToDelete} />
      <P size="base">
        Are you sure you want to delete this saved plan? This action cannot be undone.
      </P>
      <P size="lg" class="font-semibold text-neutral-900 dark:text-neutral-100">
        {planToDelete.name}
      </P>
      <div class="flex justify-end gap-2">
        <Button type="button" color="gray" onclick={handleDeleteCancel}>Cancel</Button>
        <Button type="submit" color="red">Delete</Button>
      </div>
    </form>
  {/if}
</Modal>
