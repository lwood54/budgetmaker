<script lang="ts">
  import { Chart } from 'flowbite-svelte';
  import { getIsDarkMode } from '$lib/store/app.svelte';
  import { browser } from '$app/environment';

  const { limit, remaining, spent }: { limit: number; remaining: number; spent: number } = $props();

  const isDarkMode = $derived(getIsDarkMode());

  // Function to get CSS custom property value
  function getCSSCustomProperty(property: string): string {
    if (!browser) return '#ffffff';
    const value = getComputedStyle(document.documentElement).getPropertyValue(property).trim();
    return value || '#ffffff';
  }

  // Reactive colors based on dark mode state
  const chartColors = $derived(() => {
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
      // @ts-ignore - ApexCharts supports array return but types don't reflect this
      formatter: function (val: number, opts) {
        // return [opts.w.globals.seriesNames[opts.seriesIndex], `$${val}`]; // NOTE: use array to stack labels
        return `$${val}`;
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
          return `$${val}`;
        },
        style: {
          colors: chartColors().text,
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return `$${val}`;
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
