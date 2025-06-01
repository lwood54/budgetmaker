<script lang="ts">
  import { Chart, P } from 'flowbite-svelte';
  import { getIsDarkMode } from '$lib/store/app.svelte';
  import { browser } from '$app/environment';
  import { formatCurrency } from '$lib/utils/money';

  const { limit, remaining, spent }: { limit: number; remaining: number; spent: number } = $props();

  const isDarkMode = $derived(getIsDarkMode());

  // Function to get CSS custom property value
  function getCSSCustomProperty(property: string): string {
    if (!browser) return '#ffffff';
    const value = getComputedStyle(document.documentElement).getPropertyValue(property).trim();
    return value || '#ffffff';
  }

  // Reactive colors based on dark mode state
  const chartColors = $derived((useTWClass?: boolean) => {
    if (!browser) {
      // Fallback colors for SSR
      return {
        spent: '#f97316', // Orange for spent
        limit: '#1C64F2', // Blue for limit
        remaining: '#22C55E', // Green for remaining
        overBudget: '#EF4444', // Red for over budget
        text: '#ffffff',
        grid: '#ffffff',
      };
    }

    if (useTWClass) {
      return {
        spent: 'text-accent-600 dark:text-accent-400',
        limit: 'text-gray-600 dark:text-gray-400',
        remaining: 'text-secondary-600 dark:text-secondary-400',
        overBudget: 'text-red-600 dark:text-red-400',
        text: 'text-font-default dark:text-font-default',
        grid: 'border-gray-600 dark:border-gray-400',
      };
    }
    return {
      spent: isDarkMode
        ? getCSSCustomProperty('--color-accent-400') // Lighter orange for dark mode
        : getCSSCustomProperty('--color-accent-600'), // Darker orange for light mode
      limit: isDarkMode
        ? getCSSCustomProperty('--color-gray-600') // Lighter blue for dark mode
        : getCSSCustomProperty('--color-gray-400'), // Darker blue for light mode
      remaining: isDarkMode
        ? getCSSCustomProperty('--color-secondary-400') // Lighter green for dark mode
        : getCSSCustomProperty('--color-secondary-600'), // Darker green for light mode
      overBudget: isDarkMode
        ? '#f87171' // Lighter red for dark mode
        : '#dc2626', // Darker red for light mode
      text: isDarkMode ? getCSSCustomProperty('--color-font-default') : '#1e293b',
      grid: isDarkMode ? getCSSCustomProperty('--color-border') : '#e2e8f0',
    };
  });

  const series = $derived(() => {
    if (remaining >= 0) {
      return [
        { name: 'Spent', data: [0, spent] },
        { name: 'Limit', data: [limit, 0] },
        { name: 'Remaining', data: [0, remaining] },
      ];
    } else {
      return [
        { name: 'Spent', data: [0, spent] },
        { name: 'Limit', data: [limit, 0] },
        { name: 'Over Budget', data: [Math.abs(remaining), 0] },
      ];
    }
  });

  const colors = $derived(() => {
    if (remaining >= 0) {
      return [
        chartColors().spent, // Spent
        chartColors().limit, // Limit
        chartColors().remaining, // Remaining
      ];
    } else {
      return [
        chartColors().spent, // Spent
        chartColors().limit, // Limit
        chartColors().overBudget, // Over Budget
      ];
    }
  });
</script>

<div class="flex flex-col gap-2 @md:flex-row">
  <div class="flex items-center gap-2">
    <P size="sm">Spent:</P>
    <P size="sm" class={`${chartColors(true).spent}`}>
      {formatCurrency(spent)}
    </P>
  </div>
  <div class="flex items-center gap-2">
    <P size="sm">Limit:</P>
    <P size="sm" class={`${chartColors(true).limit}`}>{formatCurrency(limit)}</P>
  </div>
  {#if remaining >= 0}
    <div class="flex items-center gap-2">
      <P size="sm">Remaining:</P>
      <P size="sm" class={`${chartColors(true).remaining}`}>{formatCurrency(remaining)}</P>
    </div>
  {:else}
    <div class="flex items-center gap-2">
      <P size="sm">Over Budget:</P>
      <P size="sm" class={`${chartColors(true).overBudget}`}
        >{formatCurrency(Math.abs(remaining))}</P
      >
    </div>
  {/if}
</div>

<Chart
  options={{
    series: series(),
    colors: colors(),
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: {
        show: false,
      },
      height: 200,
    },
    grid: {
      show: true,
      borderColor: chartColors().grid,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    plotOptions: {
      bar: {
        dataLabels: {
          position: 'center',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return formatCurrency(val);
      },
      style: {
        colors: [chartColors().text],
      },
    },
    stroke: {
      width: 0,
      colors: ['transparent'],
    },
    xaxis: {
      labels: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: true,
      },
    },
    yaxis: {
      labels: {
        formatter: function (val: number) {
          return formatCurrency(val);
        },
        style: {
          colors: chartColors().text,
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return formatCurrency(val);
        },
      },
    },
    fill: {
      opacity: 1,
    },
    legend: {
      show: true,
      inverseOrder: true,
      labels: {
        colors: chartColors().text,
      },
    },
  }}
/>
