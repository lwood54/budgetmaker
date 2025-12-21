<script lang="ts">
  import { P, Button, Card } from 'flowbite-svelte';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import { getProjections } from '$lib/api/projections.remote';
  import CreateProjection from './components/CreateProjection.svelte';
  import { goto } from '$app/navigation';

  const projectionsPromise = getProjections();

  let showCreateForm = $state(false);

  function handleCreateSuccess() {
    showCreateForm = false;
  }

  function handleCreateCancel() {
    showCreateForm = false;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getStrategyDisplayName(strategy: string): string {
    const names: Record<string, string> = {
      snowball: 'Snowball',
      avalanche: 'Avalanche',
      highest_balance: 'Highest Balance',
      lowest_balance: 'Lowest Balance',
      custom: 'Custom',
    };
    return names[strategy] || strategy;
  }
</script>

<svelte:head>
  <title>Paydown Projections</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8 flex items-center justify-between">
    <div>
      <P size="xl" class="mb-2 font-bold">Paydown Projections</P>
      <P class="text-neutral-600 dark:text-neutral-400">
        Create and manage 10-year financial projections to track paydown strategies
      </P>
    </div>
    <Button color="primary" onclick={() => (showCreateForm = true)} class="flex items-center gap-2">
      <PlusOutline class="h-5 w-5" />
      New Projection
    </Button>
  </div>

  {#if showCreateForm}
    <div class="mb-8">
      <CreateProjection onSuccess={handleCreateSuccess} onCancel={handleCreateCancel} />
    </div>
  {:else}
    {#await projectionsPromise}
      <div class="text-center">
        <P>Loading projections...</P>
      </div>
    {:then projections}
      {#if projections.length === 0}
        <Card class="p-12 text-center">
          <P size="xl" class="mb-4 font-semibold">No Projections Yet</P>
          <P class="mb-6 text-neutral-600 dark:text-neutral-400">
            Create your first 10-year financial projection to start tracking paydown strategies
          </P>
          <Button color="primary" onclick={() => (showCreateForm = true)}>
            Create Your First Projection
          </Button>
        </Card>
      {:else}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each projections as projection (projection.uuid)}
            <Card
              class="cursor-pointer p-6 transition-shadow hover:shadow-lg"
              onclick={() => goto(`/paydown/${projection.uuid}`)}
            >
              <div class="mb-4">
                <P size="xl" class="mb-2 font-bold">{projection.title}</P>
                <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <span>Strategy: {getStrategyDisplayName(projection.paydownStrategy)}</span>
                </div>
              </div>
              <div class="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                <P size="sm" class="text-neutral-600 dark:text-neutral-400">
                  Created {formatDate(projection.createdAt)}
                </P>
              </div>
            </Card>
          {/each}
        </div>
      {/if}
    {:catch}
      <div class="text-center">
        <P>Error loading projections</P>
      </div>
    {/await}
  {/if}
</div>
