<script lang="ts">
  import { goto } from '$app/navigation';
  import GeneratePlan from '../components/GeneratePlan.svelte';

  function handlePlanSaved(planId: string) {
    // Navigate to saved plans page with the new plan selected
    goto(`/paydown/saved?plan=${planId}`);
  }
</script>

<GeneratePlan onPlanSaved={handlePlanSaved} />
