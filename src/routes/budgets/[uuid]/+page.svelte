<script lang="ts">
  import BudgetView from '../components/BudgetView.svelte';
  import { P } from 'flowbite-svelte';

  const { data } = $props();
  // const budget = $derived(data.budget);
</script>

<div
  class="m-4 flex flex-col rounded-lg bg-neutral-400 p-4 @min-[650px]:w-sm dark:border-neutral-700 dark:bg-neutral-600"
>
  <P class="text-primary-900 dark:text-primary-200 font-semibold" size="lg">
    {data.budget?.name}
  </P>
  {#if data.budget}
    <BudgetView budget={data.budget} />
  {:else}
    <P>Budget not found</P>
  {/if}
</div>
