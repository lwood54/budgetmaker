<script lang="ts">
  import { P, Button, Card, Badge } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import { getProjection } from '$lib/api/projections.remote';
  import { goto } from '$app/navigation';
  import { formatCurrency } from '$lib/utils/money';
  import type { GroupItemType } from '$lib/server/db/schema/projections';

  let { params } = $props();

  const projection = $derived(await getProjection(params.uuid));
  // $inspect(`projection: ${projection}`);
  $inspect(projection);

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

  function getGroupItemTypeColor(
    type: GroupItemType,
  ): 'green' | 'red' | 'blue' | 'yellow' | 'gray' {
    const colors: Record<GroupItemType, 'green' | 'red' | 'blue' | 'yellow'> = {
      income: 'green',
      expense: 'red',
      savings: 'blue',
      transfer: 'yellow',
    };
    return colors[type] || 'gray';
  }

  function getGroupItemTypeLabel(type: GroupItemType): string {
    const labels: Record<GroupItemType, string> = {
      income: 'Income',
      expense: 'Expense',
      savings: 'Savings',
      transfer: 'Transfer',
    };
    return labels[type] || type;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
</script>

<svelte:head>
  <title>{projection?.title || 'Projection Details'}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  {#await projection}
    <div class="text-center">
      <P>Loading projection...</P>
    </div>
  {:then projection}
    {#if !projection}
      <Card class="p-12 text-center">
        <P size="xl" class="mb-4 font-semibold">Projection Not Found</P>
        <P class="mb-6 text-neutral-600 dark:text-neutral-400">
          The projection you're looking for doesn't exist or you don't have access to it.
        </P>
        <Button color="primary" onclick={() => goto('/paydown')}>Back to Projections</Button>
      </Card>
    {:else}
      <!-- Header -->
      <div class="mb-8">
        <Button
          color="light"
          size="sm"
          onclick={() => goto('/paydown')}
          class="mb-4 flex items-center gap-2"
        >
          <ArrowLeftOutline class="h-4 w-4" />
          Back to Projections
        </Button>

        <div class="mb-4">
          <P size="xl" class="mb-2 font-bold">{projection.title}</P>
          <div
            class="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400"
          >
            <span
              >Strategy: <strong>{getStrategyDisplayName(projection.paydownStrategy)}</strong></span
            >
            <span>Created: {formatDate(projection.createdAt)}</span>
          </div>
        </div>
      </div>

      <!-- Sections (Years) -->
      {#if projection.sections && projection.sections.length > 0}
        <div class="space-y-8">
          {#each projection.sections as section}
            <Card class="p-6">
              <div class="mb-6">
                <P size="lg" class="font-bold">{section.title}</P>
                <P size="sm" class="text-neutral-600 dark:text-neutral-400">
                  {section.intervals.length} months
                </P>
              </div>

              <!-- Intervals (Months) -->
              {#if section.intervals && section.intervals.length > 0}
                <div class="space-y-6">
                  {#each section.intervals as interval}
                    <div class="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                      <P size="base" class="mb-4 font-semibold">
                        {monthNames[interval.sequence - 1]}
                      </P>

                      <!-- Group Items -->
                      {#if interval.groupItems && interval.groupItems.length > 0}
                        <div class="space-y-3">
                          {#each interval.groupItems as item}
                            <div
                              class="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
                            >
                              <div class="flex items-center gap-3">
                                <Badge color={getGroupItemTypeColor(item.type)}>
                                  {getGroupItemTypeLabel(item.type)}
                                </Badge>
                                <div>
                                  <P size="sm" class="font-medium">{item.title}</P>
                                  {#if item.sectionName}
                                    <P size="xs" class="text-neutral-500 dark:text-neutral-400">
                                      {item.sectionName}
                                    </P>
                                  {/if}
                                  {#if item.isPaydown && item.initialBalance !== null}
                                    <P size="xs" class="text-neutral-500 dark:text-neutral-400">
                                      Initial Balance: {formatCurrency(item.initialBalance)}
                                      {#if item.interestRate !== null}
                                        • Interest: {(item.interestRate / 100).toFixed(2)}%
                                      {/if}
                                    </P>
                                  {/if}
                                </div>
                              </div>
                              <P size="sm" class="font-semibold">
                                {formatCurrency(item.amount)}
                              </P>
                            </div>
                          {/each}
                        </div>
                      {:else}
                        <P size="sm" class="text-neutral-500 dark:text-neutral-400">
                          No items for this month
                        </P>
                      {/if}

                      <!-- Interval Balances -->
                      {#if interval.intervalBalances && interval.intervalBalances.length > 0}
                        <div class="mt-4 space-y-2">
                          <P size="sm" class="font-semibold text-neutral-700 dark:text-neutral-300">
                            Balances:
                          </P>
                          {#each interval.intervalBalances as balance}
                            {@const groupItem = interval.groupItems.find(
                              (gi) => gi.uuid === balance.groupItemId,
                            )}
                            {#if groupItem}
                              <div class="flex items-center justify-between text-sm">
                                <span class="text-neutral-600 dark:text-neutral-400">
                                  {groupItem.title}:
                                </span>
                                <span class="font-medium">
                                  {formatCurrency(balance.balance)}
                                </span>
                              </div>
                            {/if}
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else}
                <P size="sm" class="text-neutral-500 dark:text-neutral-400">
                  No intervals for this section
                </P>
              {/if}
            </Card>
          {/each}
        </div>
      {:else}
        <Card class="p-12 text-center">
          <P size="xl" class="mb-4 font-semibold">No Sections Yet</P>
          <P class="mb-6 text-neutral-600 dark:text-neutral-400">
            This projection doesn't have any sections or intervals yet.
          </P>
        </Card>
      {/if}
    {/if}
  {:catch error}
    <Card class="p-12 text-center">
      <P size="xl" class="mb-4 font-semibold text-red-600 dark:text-red-400">Error</P>
      <P class="mb-6 text-neutral-600 dark:text-neutral-400">
        {error instanceof Error ? error.message : 'Failed to load projection'}
      </P>
      <Button color="primary" onclick={() => goto('/paydown')}>Back to Projections</Button>
    </Card>
  {/await}
</div>
