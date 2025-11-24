<script lang="ts">
  import { toLocalCurrency } from '$lib/helpers/conversions';
  import { Card } from 'flowbite-svelte';
  import { Chart } from '@flowbite-svelte-plugins/chart';

  let { balances }: { balances: number[] } = $props();
</script>

<Card size="xl" class="h-full min-h-[300px] p-4">
  <Chart
    options={{
      series: [
        {
          name: 'Balance',
          data: balances,
        },
      ],
      chart: {
        type: 'line',
        height: '100%',
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: true,
        },
      },
      colors: ['#0EC7C1'], // Keep the original teal color
      stroke: {
        width: 2,
        curve: 'smooth',
      },
      grid: {
        show: true,
        borderColor: '#E5E7EB',
        strokeDashArray: 4,
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
      },
      xaxis: {
        categories: balances.map((_, index) => `Month ${index}`),
        labels: {
          style: {
            colors: '#6B7280',
          },
        },
        axisBorder: {
          show: true,
          color: '#E5E7EB',
        },
        axisTicks: {
          show: true,
          color: '#E5E7EB',
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#6B7280',
          },
          formatter: function (value: number) {
            return toLocalCurrency(value);
          },
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function (value: number) {
            return toLocalCurrency(value);
          },
        },
      },
      title: {
        text: 'Paydown Progress',
        align: 'center',
        style: {
          fontSize: '18px',
          fontWeight: '600',
          color: '#0EC7C1',
        },
      },
    }}
  />
</Card>
